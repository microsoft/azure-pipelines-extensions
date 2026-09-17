const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

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

function normalizePath(filePath) {
    return filePath.replace(/\\/g, '/');
}

function getStagedFiles() {
    const output = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR']);
    return output ? output.split(/\r?\n/).map(normalizePath).filter(Boolean) : [];
}

function getPublishableExtension(filePath) {
    const match = filePath.match(/^Extensions\/([^/]+)\//);
    if (!match) return null;

    const extensionName = match[1];
    const manifestPath = `Extensions/${extensionName}/Src/vss-extension.json`;
    if (!fs.existsSync(path.join(repoRoot, manifestPath))) return null;

    return {
        extensionName,
        manifestPath
    };
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
    return output !== null && output.split(/\r?\n/).map(normalizePath).includes(manifestPath);
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
    const stagedFiles = getStagedFiles();
    const extensionsByName = new Map();

    for (const filePath of stagedFiles) {
        const extension = getPublishableExtension(filePath);
        if (extension) {
            extensionsByName.set(extension.extensionName, extension);
        }
    }

    if (extensionsByName.size === 0) {
        return;
    }

    const bumped = [];
    const skipped = [];

    for (const extension of Array.from(extensionsByName.values()).sort(function (a, b) {
        return a.extensionName.localeCompare(b.extensionName);
    })) {
        const stagedContent = tryGit(['show', ':' + extension.manifestPath]);
        if (stagedContent === null) {
            throw new Error(`${extension.manifestPath}: manifest is not tracked in the index`);
        }

        const headContent = tryGit(['show', 'HEAD:' + extension.manifestPath]);
        const stagedVersion = readVersion(stagedContent, extension.manifestPath);
        const headVersion = headContent === null ? null : readVersion(headContent, extension.manifestPath);

        if (headVersion !== null && stagedVersion !== headVersion) {
            skipped.push(`${extension.extensionName} (${stagedVersion} already staged)`);
            continue;
        }

        if (hasUnstagedManifestChanges(extension.manifestPath)) {
            throw new Error(
                `${extension.manifestPath} has unstaged changes. Stage or stash them before committing so the hook does not include unintended manifest edits.`
            );
        }

        const newVersion = bumpPatch(stagedVersion, extension.manifestPath);
        updateManifestVersion(extension.manifestPath, stagedVersion, newVersion);
        bumped.push(`${extension.extensionName}: ${stagedVersion} -> ${newVersion}`);
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
