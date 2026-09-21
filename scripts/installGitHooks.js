const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const hooksPath = path.join(repoRoot, '.githooks');

if (process.env.TF_BUILD || process.env.CI) {
    process.exit(0);
}

if (!fs.existsSync(path.join(repoRoot, '.git')) || !fs.existsSync(hooksPath)) {
    process.exit(0);
}

try {
    fs.chmodSync(path.join(hooksPath, 'pre-commit'), 0o755);
    cp.execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
        cwd: repoRoot,
        stdio: 'ignore'
    });
}
catch (err) {
    console.warn('Warning: failed to configure git hooks: ' + err.message);
}
