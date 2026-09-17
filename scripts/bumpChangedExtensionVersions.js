const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const extensionChanges = require('./extensionChangeUtils');

const repoRoot = path.resolve(__dirname, '..');

function git(args, options) {
    return cp.execFileSync('git', args, {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', options && options.ignoreErrors ? 'ignore' : 'pipe']
    }).trim();
}

function tryGit(args) {
    try {
        return git(args, { ignoreErrors: true });
    }
    catch (_err) {
        return null;
    }
}

/** Branches to look for a comparison baseline, in preference order. */
const BASELINE_BRANCH_CANDIDATES = ['master', 'origin/master'];

/**
 * Finds the merge-base commit between HEAD and the first available baseline
 * branch (local `master`, falling back to `origin/master`). Used to detect
 * extension changes that were committed earlier on this branch without a
 * version bump, which a plain staged-vs-HEAD diff would miss.
 * @returns {string | null} The merge-base commit SHA, or null if no baseline
 * branch or common ancestor could be found (e.g. the very first commit).
 */
function getBaselineRef() {
    for (const ref of BASELINE_BRANCH_CANDIDATES) {
        if (tryGit(['rev-parse', '--verify', '--quiet', ref]) === null) {
            continue;
        }

        const mergeBase = tryGit(['merge-base', 'HEAD', ref]);
        if (mergeBase) {
            return mergeBase;
        }
    }

    return null;
}

/**
 * Lists files that differ between the index (what is about to be committed)
 * and a comparison point.
 * @param {string | null} against Commit-ish to diff the index against, or
 * null to diff the index against HEAD (i.e. only this commit's own staged
 * changes).
 * @returns {string[]} Normalized, repo-relative changed file paths.
 */
function getChangedFiles(against) {
    const args = ['diff', '--cached', '--name-only', '--diff-filter=ACMRD'];
    if (against) {
        args.push(against);
    }

    const output = git(args);
    return output ? output.split(/\r?\n/).map(extensionChanges.normalizeGitPath).filter(Boolean) : [];
}

function readVersion(content, manifestPath) {
    try {
        const manifest = JSON.parse(content);
        if (typeof manifest.version !== 'string' || !manifest.version) {
            throw new Error('missing version field');
        }
        return manifest.version;
    }
    catch (err) {
        throw new Error(`${manifestPath}: ${err.message}`);
    }
}

function bumpPatch(version, manifestPath) {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) {
        throw new Error(`${manifestPath}: version must use major.minor.patch format, found "${version}"`);
    }

    return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

function hasUnstagedManifestChanges(manifestPath) {
    const output = tryGit(['diff', '--name-only', '--', manifestPath]);
    return output !== null && output.split(/\r?\n/).map(extensionChanges.normalizeGitPath).includes(manifestPath);
}

function stageManifest(manifestPath) {
    cp.execFileSync('git', ['add', '--', manifestPath], {
        cwd: repoRoot,
        stdio: 'ignore'
    });
}

function updateManifestVersion(manifestPath, oldVersion, newVersion) {
    const fullPath = path.join(repoRoot, manifestPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const updated = content.replace(
        /(^\s*"version"\s*:\s*")([^"]+)(")/m,
        function (_match, prefix, current, suffix) {
            if (current !== oldVersion) {
                throw new Error(`${manifestPath}: working tree version changed while hook was running`);
            }
            return prefix + newVersion + suffix;
        }
    );

    if (updated === content) {
        throw new Error(`${manifestPath}: failed to locate version field`);
    }

    fs.writeFileSync(fullPath, updated, 'utf8');
    stageManifest(manifestPath);
}

function main() {
    const baselineRef = getBaselineRef();
    if (!baselineRef) {
        console.warn(
            'Warning: could not resolve a master baseline (tried "master", "origin/master"). ' +
                'Only checking this commit\'s staged changes; changes committed earlier on this branch without a version bump may be missed.'
        );
    }

    // Rule A: files this commit itself is staging. Any of these touching an
    // extension (or anything outside Extensions/) always triggers a bump for
    // the affected extension(s), regardless of master.
    const stagedFiles = getChangedFiles(null);
    const extensionsFromThisCommit = extensionChanges.resolveChangedPublishableExtensions(stagedFiles, repoRoot, {
        includeAllOutsideExtensions: true
    });

    // Rule B: files changed anywhere between master and the index (i.e. the
    // whole branch so far, including earlier commits). Used only to catch
    // extensions whose source changed on this branch but were never bumped -
    // e.g. a commit made before the hook existed, or with --no-verify.
    const extensionsWithDebt = baselineRef
        ? extensionChanges.resolveChangedPublishableExtensions(getChangedFiles(baselineRef), repoRoot, {
            includeAllOutsideExtensions: true
        })
        : [];

    const candidates = Array.from(new Set(extensionsFromThisCommit.concat(extensionsWithDebt))).sort();
    if (candidates.length === 0) {
        return;
    }

    const bumped = [];
    const skipped = [];

    for (const extensionName of candidates) {
        const manifestPath = extensionChanges.getExtensionManifestRelativePath(repoRoot, extensionName);
        if (!manifestPath) {
            throw new Error(`No vss-extension.json found for extension: ${extensionName}`);
        }

        const stagedContent = tryGit(['show', ':' + manifestPath]);
        if (stagedContent === null) {
            throw new Error(`${manifestPath}: manifest is not tracked in the index`);
        }

        const headContent = tryGit(['show', 'HEAD:' + manifestPath]);
        const stagedVersion = readVersion(stagedContent, manifestPath);
        const headVersion = headContent === null ? null : readVersion(headContent, manifestPath);

        if (headVersion !== null && stagedVersion !== headVersion) {
            skipped.push(`${extensionName} (${stagedVersion} already staged)`);
            continue;
        }

        // This commit's own changes always warrant a bump. Otherwise, this
        // extension is only here because of branch-wide debt vs master, so
        // only bump it if that debt has not already been paid off.
        if (!extensionsFromThisCommit.includes(extensionName) && baselineRef) {
            const baselineContent = tryGit(['show', baselineRef + ':' + manifestPath]);
            const baselineVersion = baselineContent === null ? null : readVersion(baselineContent, manifestPath);

            if (baselineVersion !== null && baselineVersion !== stagedVersion) {
                skipped.push(`${extensionName} (${stagedVersion} already bumped vs master)`);
                continue;
            }
        }

        if (hasUnstagedManifestChanges(manifestPath)) {
            throw new Error(
                `${manifestPath} has unstaged changes. Stage or stash them before committing so the hook does not include unintended manifest edits.`
            );
        }

        const newVersion = bumpPatch(stagedVersion, manifestPath);
        updateManifestVersion(manifestPath, stagedVersion, newVersion);
        bumped.push(`${extensionName}: ${stagedVersion} -> ${newVersion}`);
    }

    if (bumped.length > 0) {
        console.log('Bumped extension versions:');
        bumped.forEach(function (message) {
            console.log('  ' + message);
        });
    }

    if (skipped.length > 0) {
        console.log('Skipped extension versions:');
        skipped.forEach(function (message) {
            console.log('  ' + message);
        });
    }
}

try {
    main();
}
catch (err) {
    console.error('Failed to bump changed extension versions: ' + err.message);
    process.exit(1);
}
