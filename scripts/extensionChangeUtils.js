const fs = require('node:fs');
const path = require('node:path');

const SHARED_INFRA_PREFIXES = [
    'Extensions/Common/',
    'Extensions/ArtifactEngine/',
    'Extensions/ArtifactEngineV2/',
    'common.json',
    'externals.json',
    'package.json',
    'package-lock.json',
    'package.js',
    'package-utils.js',
    'base.tsconfig.json',
    'tsconfig.json',
    'gulpfile.js',
    'definitions/',
    'TaskModules/',
    'scripts/',
    '.pipelines/',
    'ci/'
];
const SHARED_INFRA_IGNORE_EXTENSIONS = ['.md', '.txt', '.png', '.jpg', '.gif'];

/**
 * Converts a git path to the forward-slash format used by git command output.
 * @param {string} filePath
 * @returns {string}
 */
function normalizeGitPath(filePath) {
    return filePath.replace(/\\/g, '/');
}

/**
 * Resolves an extension manifest path, supporting every location the build
 * system accepts when syncing versions.
 * @param {string} repoRoot
 * @param {string} extensionName
 * @returns {string | null}
 */
function getExtensionManifestPath(repoRoot, extensionName) {
    const possiblePaths = [
        path.join(repoRoot, 'Extensions', extensionName, 'Src', 'vss-extension.json'),
        path.join(repoRoot, 'Extensions', extensionName, 'src', 'vss-extension.json'),
        path.join(repoRoot, 'Extensions', extensionName, 'vss-extension.json')
    ];

    for (const manifestPath of possiblePaths) {
        if (fs.existsSync(manifestPath)) {
            return manifestPath;
        }
    }

    return null;
}

/**
 * Resolves an extension manifest path relative to the repository root.
 * @param {string} repoRoot
 * @param {string} extensionName
 * @returns {string | null}
 */
function getExtensionManifestRelativePath(repoRoot, extensionName) {
    const manifestPath = getExtensionManifestPath(repoRoot, extensionName);
    return manifestPath ? normalizeGitPath(path.relative(repoRoot, manifestPath)) : null;
}

/**
 * Discovers publishable extensions by finding extension folders with manifests.
 * @param {string} repoRoot
 * @returns {string[]}
 */
function discoverPublishableExtensions(repoRoot) {
    const extensionsRoot = path.join(repoRoot, 'Extensions');
    return fs.readdirSync(extensionsRoot).filter(function (extensionName) {
        const extensionPath = path.join(extensionsRoot, extensionName);
        return fs.statSync(extensionPath).isDirectory()
            && fs.existsSync(path.join(extensionPath, 'Src', 'vss-extension.json'));
    });
}

/**
 * Returns true if changed files touch shared infrastructure that affects every
 * extension. Documentation and image files in shared paths are ignored.
 * @param {string[]} files
 * @returns {boolean}
 */
function hitsSharedInfra(files) {
    return files.some(function (filePath) {
        const normalizedPath = normalizeGitPath(filePath);
        const dotIndex = normalizedPath.lastIndexOf('.');
        if (dotIndex >= 0 && SHARED_INFRA_IGNORE_EXTENSIONS.indexOf(normalizedPath.substring(dotIndex).toLowerCase()) >= 0) {
            return false;
        }

        return SHARED_INFRA_PREFIXES.some(function (prefix) {
            return normalizedPath === prefix || normalizedPath.indexOf(prefix) === 0;
        });
    });
}

/**
 * Maps changed files to extension names. Returns null when a shared-infra file
 * is changed so callers can choose their own "all affected" behavior.
 * @param {string[]} files
 * @param {(extensionName: string) => boolean} filterFn
 * @returns {string[] | null}
 */
function resolveChangedExtensions(files, filterFn) {
    if (hitsSharedInfra(files)) {
        console.log("Shared infrastructure changed -> returning null (all).");
        return null;
    }

    /** @type {Record<string, boolean>} */
    const selected = {};
    files.forEach(function (filePath) {
        const match = normalizeGitPath(filePath).match(/^Extensions\/([^/]+)\//);
        if (!match) return;

        const extensionName = match[1];
        if (filterFn(extensionName)) {
            selected[extensionName] = true;
        }
    });

    return Object.keys(selected);
}

/**
 * Resolves changed publishable extension names. Shared-infra changes always
 * select all publishable extensions.
 * @param {string[] | null} files
 * @param {string} repoRoot
 * @returns {string[]}
 */
function resolveChangedPublishableExtensions(files, repoRoot) {
    const publishable = discoverPublishableExtensions(repoRoot);
    if (files === null) {
        return publishable;
    }

    const selected = resolveChangedExtensions(files, function (extensionName) {
        return publishable.indexOf(extensionName) >= 0;
    });

    return selected === null ? publishable : selected;
}

module.exports = {
    discoverPublishableExtensions,
    getExtensionManifestPath,
    getExtensionManifestRelativePath,
    hitsSharedInfra,
    normalizeGitPath,
    resolveChangedExtensions,
    resolveChangedPublishableExtensions
};
