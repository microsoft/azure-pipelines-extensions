const cp = require('node:child_process');
const path = require('node:path');

const cwd = path.resolve(__dirname, '..');

function installGitHooks() {
  try {
    console.log(`🛠️ Git hooks registration started.`);

    cp.execFileSync('git', ['rev-parse', '--git-dir'], {
      cwd,
      stdio: 'ignore'
    });

    let hooksPath = '';

    try {
      hooksPath = cp.execFileSync('git', ['config', '--local', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' }).trim();
    } catch (error) {
      hooksPath = '';
    }

    if (hooksPath && hooksPath !== '.githooks') {
      console.log(`\x1b[A\x1b[K⚠️ Git hooks not changed: core.hooksPath is already set to ${hooksPath}.`);
      return;
    }

    if (hooksPath === '.githooks') {
      console.log('\x1b[A\x1b[K⏩ Git hooks already registered: .githooks');
      return;
    }

    cp.execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
      cwd,
      stdio: 'ignore'
    });
    console.log('\x1b[A\x1b[K✅ Git hooks registered: .githooks');
  } catch (error) {
    console.log('\x1b[A\x1b[K❌ Git hooks not registered: this directory is not a Git repository.');
  }
}

installGitHooks();
