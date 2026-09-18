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
 * Resolves the remote-tracking ref for the current branch (e.g. `origin/foo`
 * for local branch `foo`), representing the state of this branch as of the
 * last successful `git push`.
 *
 * CI republishes every changed extension to the Marketplace on every push
 * (see `.pipelines/1es-migration/azure-pipelines-integration.yml`) and
 * rejects a push whose manifest version does not exceed what is already
 * published there. Since the previous push is what put that version on the
 * Marketplace, this ref is the right baseline for deciding whether a further
 * bump is needed - as opposed to `getBaselineRef()`, which only tells us
 * whether the extension was bumped at all *somewhere* on this branch.
 * @returns {string | null} The remote-tracking ref name (not a commit SHA),
 * or null if the current branch has no remote-tracking ref yet (detached
 * HEAD, or the branch has never been pushed).
 */
function getPushedBranchRef() {
    const branchName = tryGit(['rev-parse', '--abbrev-ref', 'HEAD']);
    if (!branchName || branchName === 'HEAD') {
        return null;
    }

    const remoteRef = 'origin/' + branchName;
    return tryGit(['rev-parse', '--verify', '--quiet', remoteRef]) === null ? null : remoteRef;
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
    const candidates = extensionChanges.resolveChangedPublishableExtensions(changedFiles, repoRoot).sort();

    if (candidates.length === 0) {
        return;
    }

    // CI republishes every candidate extension on every push and requires its
    // version to exceed what is already on the Marketplace - which is exactly
    // what the previous push published. So the right "already bumped, skip
    // it" baseline is the last pushed state of this branch (`origin/<branch>`),
    // not master: comparing against master would only catch the first push,
    // and every push after that would try to republish the same version and
    // fail. Fall back to the master baseline when the branch has never been
    // pushed yet (no remote-tracking ref to compare against).
    const skipCheckRef = getPushedBranchRef() || baselineRef;

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

        // Bump once per push: if the staged version already differs from the
        // skip-check baseline, this extension was already bumped since that
        // baseline was recorded, so leave it alone no matter what changes
        // further - one bump per push is enough, it should not creep up on
        // every commit made before the next push.
        if (skipCheckRef) {
            const baselineContent = tryGit(['show', skipCheckRef + ':' + manifestPath]);
            const baselineVersion = baselineContent === null ? null : readVersion(baselineContent, manifestPath);

            if (baselineVersion !== null && stagedVersion !== baselineVersion) {
                skipped.push(`${extensionName} (${stagedVersion} already bumped since ${skipCheckRef})`);
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
