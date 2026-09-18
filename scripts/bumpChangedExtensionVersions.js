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
const BASELINE_BRANCH_CANDIDATES = ['origin/master', 'master'];

/**
 * Finds the merge-base commit between HEAD and the first available baseline
 * branch (tracking `origin/master`, falling back to local `master` for offline
 * or single-repository workflows). Used to detect extension changes that were
 * committed earlier on this branch without a version bump, which a plain
 * staged-vs-HEAD diff would miss.
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
            'Warning: could not resolve a master baseline (tried "origin/master", "master"). ' +
                'Only checking this commit\'s staged changes; changes committed earlier on this branch without a version bump may be missed.'
        );
    }

    // Find every extension touched anywhere on this branch (from the master
    // baseline through the staged index), not just by this commit.
    const changedFiles = baselineRef ? getChangedFiles(baselineRef) : getChangedFiles(null);
    const candidates = extensionChanges.resolveChangedPublishableExtensions(changedFiles, repoRoot, {
        includeAllOutsideExtensions: true
    }).sort();

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

        const stagedVersion = readVersion(stagedContent, manifestPath);

        // Bump once per branch: if the staged version already differs from
        // the master baseline, this extension was already bumped somewhere
        // on this branch, so leave it alone no matter what changes further -
        // one bump per PR is enough, it should not creep up on every commit.
        if (baselineRef) {
            const baselineContent = tryGit(['show', baselineRef + ':' + manifestPath]);
            const baselineVersion = baselineContent === null ? null : readVersion(baselineContent, manifestPath);

            if (baselineVersion !== null && stagedVersion !== baselineVersion) {
                skipped.push(`${extensionName} (${stagedVersion} already bumped on this branch)`);
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
