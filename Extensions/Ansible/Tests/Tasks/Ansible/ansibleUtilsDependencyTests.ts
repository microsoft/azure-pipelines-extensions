// Exercises the real ssh2 / ssh2-sftp-client integration in ansibleUtils.ts against a local SSH/SFTP
// server, instead of the mocked './ansibleUtils' used by the scenario suite in _suite.ts. This is the
// only coverage that would catch a behavioral regression from bumping those dependencies' major versions.
import assert = require('assert');
import childProcess = require('child_process');
import crypto = require('crypto');
import fs = require('fs');
import os = require('os');
import path = require('path');
import util = require('util');

process.env['DISTRIBUTEDTASK_TASKS_NODE_SKIPDEBUGLOGSWHENDEBUGMODEOFF'] = 'true';

// util.isDate() was removed from modern Node, but older ssh2 releases still destructure it from 'util' at
// module load and call it unconditionally in their server-side ATTRS encoder; restore it before requiring
// ssh2 so this test double can act as an SFTP server regardless of which ssh2 version is currently pinned.
if (typeof (util as any).isDate !== 'function') {
    (util as any).isDate = (value: unknown): boolean => Object.prototype.toString.call(value) === '[object Date]';
}

const taskFolderPath = path.join(process.cwd(), '_build', 'Extensions', 'Ansible', 'Src', 'Tasks', 'Ansible');
const taskMainPath = path.join(taskFolderPath, 'main.js');

// Load the task's own installed ssh2, matching exactly what ansibleUtils.js resolves at runtime.
const ssh2 = require(path.join(taskFolderPath, 'node_modules', 'ssh2'));
const { STATUS_CODE, flagsToString } = ssh2.utils.sftp;

const TEST_USERNAME = 'ansible-dependency-test-user';
const TEST_PASSWORD = 'ansible-dependency-test-password';

function ensureTaskJsCompiled(): void {
  if (fs.existsSync(path.join(taskFolderPath, 'ansibleUtils.js'))) {
    return;
  }

  const tscCmd = 'node "' + path.join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc') +
    '" --project "' + path.join(taskFolderPath, 'tsconfig.json') + '" --noEmit false';
  const result = childProcess.spawnSync(tscCmd, {
    cwd: process.cwd(),
    shell: true,
    stdio: 'pipe',
    encoding: 'utf8'
  });

  if (result.status !== 0 || !fs.existsSync(taskMainPath)) {
    const stderr = result.stderr || '';
    const stdout = result.stdout || '';
    throw new Error('Failed to compile Ansible task JavaScript for tests.\nSTDOUT:\n' + stdout + '\nSTDERR:\n' + stderr);
  }
}

function loadAnsibleUtils(): any {
  return require(path.join(taskFolderPath, 'ansibleUtils.js'));
}

// Maps a remote SFTP path onto a real directory on disk so the fake server performs actual file I/O.
function toLocalPath(rootDir: string, remotePath: string): string {
  const normalized = path.posix.normalize('/' + remotePath).replace(/^\/+/, '');
  return path.join(rootDir, normalized);
}

interface TestSshServer {
  port: number;
  close(): Promise<void>;
}

// Starts a minimal local SSH2 server; when sftpRoot is provided, SFTP requests are backed by that real directory.
function startTestSshServer(sftpRoot?: string): Promise<TestSshServer> {
  // Generated via Node's own crypto (not ssh2.utils.generateKeyPairSync) so this works against any pinned ssh2 version.
  const hostKey = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' }
  }).privateKey;

  const server = new ssh2.Server({ hostKeys: [hostKey] }, (client: any) => {
    client.on('authentication', (ctx: any) => {
      if (ctx.method !== 'password' || ctx.username !== TEST_USERNAME || ctx.password !== TEST_PASSWORD) {
        return ctx.reject(['password']);
      }
      ctx.accept();
    }).on('ready', () => {
      client.on('session', (acceptSession: any) => {
        const session = acceptSession();
        session.on('sftp', (acceptSftp: any) => {
          if (!sftpRoot) {
            return;
          }
          const sftp = acceptSftp();
          const openHandles = new Map<number, number>();
          let nextHandle = 0;

          sftp.on('REALPATH', (reqid: number, reqPath: string) => {
            const resolved = path.posix.normalize('/' + reqPath.replace(/^\/+/, ''));
            sftp.name(reqid, [{ filename: resolved, longname: resolved, attrs: {} }]);
          });

          const statHandler = (reqid: number, reqPath: string): void => {
            fs.stat(toLocalPath(sftpRoot, reqPath), (err, stats) => {
              if (err) {
                return sftp.status(reqid, STATUS_CODE.NO_SUCH_FILE);
              }
              // atime/mtime are omitted: ssh2@1.4.0's server-side attrs() throws ("isDate is not a function") when they're set.
              sftp.attrs(reqid, {
                mode: stats.mode,
                uid: stats.uid,
                gid: stats.gid,
                size: stats.size
              });
            });
          };
          sftp.on('STAT', statHandler);
          sftp.on('LSTAT', statHandler);

          sftp.on('OPEN', (reqid: number, filename: string, flags: number) => {
            const mode = flagsToString(flags) || 'r';
            fs.open(toLocalPath(sftpRoot, filename), mode, 0o644, (err, fd) => {
              if (err) {
                return sftp.status(reqid, STATUS_CODE.FAILURE);
              }
              const handleId = nextHandle++;
              openHandles.set(handleId, fd);
              const handle: Buffer = (Buffer as any).alloc(4);
              handle.writeUInt32BE(handleId, 0);
              sftp.handle(reqid, handle);
            });
          });

          sftp.on('WRITE', (reqid: number, handle: Buffer, offset: number, data: Buffer) => {
            const fd = openHandles.get(handle.readUInt32BE(0));
            if (fd === undefined) {
              return sftp.status(reqid, STATUS_CODE.FAILURE);
            }
            fs.write(fd, data, 0, data.length, offset, (err) => {
              sftp.status(reqid, err ? STATUS_CODE.FAILURE : STATUS_CODE.OK);
            });
          });

          sftp.on('CLOSE', (reqid: number, handle: Buffer) => {
            const handleId = handle.readUInt32BE(0);
            const fd = openHandles.get(handleId);
            if (fd === undefined) {
              return sftp.status(reqid, STATUS_CODE.FAILURE);
            }
            openHandles.delete(handleId);
            fs.close(fd, (err) => {
              sftp.status(reqid, err ? STATUS_CODE.FAILURE : STATUS_CODE.OK);
            });
          });

          sftp.on('MKDIR', (reqid: number, reqPath: string) => {
            fs.mkdir(toLocalPath(sftpRoot, reqPath), (err: NodeJS.ErrnoException | null) => {
              if (!err) {
                return sftp.status(reqid, STATUS_CODE.OK);
              }
              if (err.code === 'EEXIST') {
                // Mirrors a real SFTP server: mkdir on an existing directory fails with FAILURE/"Failure".
                return sftp.status(reqid, STATUS_CODE.FAILURE, 'Failure');
              }
              sftp.status(reqid, STATUS_CODE.FAILURE);
            });
          });

          sftp.on('OPENDIR', (reqid: number) => {
            const handle: Buffer = (Buffer as any).alloc(4);
            sftp.handle(reqid, handle);
          });

          sftp.on('READDIR', (reqid: number) => {
            sftp.status(reqid, STATUS_CODE.EOF);
          });
        });
      });
    });
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', function (this: any) {
      resolve({
        port: this.address().port,
        close: () => new Promise<void>((res) => server.close(() => res()))
      });
    });
  });
}

function connectionConfig(port: number, password: string = TEST_PASSWORD): any {
  return {
    host: '127.0.0.1',
    port,
    username: TEST_USERNAME,
    password,
    readyTimeout: 10000
  };
}

describe('Ansible dependency behavior (ssh2 / ssh2-sftp-client)', function () {
  this.timeout(60000);

  before(function () {
    ensureTaskJsCompiled();
  });

  it('resolves the SSH client on successful authentication', async function () {
    const testServer = await startTestSshServer();
    try {
      const ansibleUtils = loadAnsibleUtils();
      const client = await ansibleUtils.setupSshClientConnection(connectionConfig(testServer.port));
      assert(client, 'expected an SSH client to be returned');
      client.end();
    } finally {
      await testServer.close();
    }
  });

  it('rejects the SSH client connection when authentication fails', async function () {
    const testServer = await startTestSshServer();
    try {
      const ansibleUtils = loadAnsibleUtils();
      let rejected = false;
      try {
        await ansibleUtils.setupSshClientConnection(connectionConfig(testServer.port, 'wrong-password'));
      } catch (err) {
        rejected = true;
      }
      assert(rejected, 'expected connection to be rejected on bad credentials');
    } finally {
      await testServer.close();
    }
  });

  it('uploads a single file to the remote machine via SFTP', async function () {
    const remoteRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ansible-sftp-remote-'));
    const localSrcDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ansible-sftp-local-'));
    const localFile = path.join(localSrcDir, 'playbook.yml');
    fs.writeFileSync(localFile, 'hosts: all\n', 'utf8');

    const testServer = await startTestSshServer(remoteRoot);
    try {
      // A single-file put() targets an already-existing remote directory, mirroring the task's
      // usage where the destination directory (e.g. /tmp) is created ahead of time.
      const ansibleUtils = loadAnsibleUtils();
      const result = await ansibleUtils.copyFileToRemoteMachine(localFile, '/playbook.yml', connectionConfig(testServer.port));

      assert.strictEqual(result, '0', 'expected successful upload to resolve with "0"');
      const uploaded = fs.readFileSync(path.join(remoteRoot, 'playbook.yml'), 'utf8');
      assert.strictEqual(uploaded, 'hosts: all\n', 'uploaded file contents should match the local source');
    } finally {
      await testServer.close();
      fs.rmSync(remoteRoot, { recursive: true, force: true });
      fs.rmSync(localSrcDir, { recursive: true, force: true });
    }
  });

  it('uploads a directory tree to the remote machine via SFTP', async function () {
    const remoteRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ansible-sftp-remote-'));
    const localSrcDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ansible-sftp-local-'));
    fs.mkdirSync(path.join(localSrcDir, 'roles', 'common'), { recursive: true });
    fs.writeFileSync(path.join(localSrcDir, 'site.yml'), 'hosts: all\n', 'utf8');
    fs.writeFileSync(path.join(localSrcDir, 'roles', 'common', 'main.yml'), 'tasks: []\n', 'utf8');

    const testServer = await startTestSshServer(remoteRoot);
    try {
      const ansibleUtils = loadAnsibleUtils();
      const result = await ansibleUtils.copyFileToRemoteMachine(localSrcDir, '/ansiblePlaybookRoot', connectionConfig(testServer.port));

      assert.strictEqual(result, '0', 'expected successful directory upload to resolve with "0"');
      assert.strictEqual(
        fs.readFileSync(path.join(remoteRoot, 'ansiblePlaybookRoot', 'site.yml'), 'utf8'),
        'hosts: all\n',
        'top-level file should be uploaded'
      );
      assert.strictEqual(
        fs.readFileSync(path.join(remoteRoot, 'ansiblePlaybookRoot', 'roles', 'common', 'main.yml'), 'utf8'),
        'tasks: []\n',
        'nested file should be uploaded'
      );
    } finally {
      await testServer.close();
      fs.rmSync(remoteRoot, { recursive: true, force: true });
      fs.rmSync(localSrcDir, { recursive: true, force: true });
    }
  });

  it('uploads a directory tree when the remote destination directory already exists', async function () {
    const remoteRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ansible-sftp-remote-'));
    fs.mkdirSync(path.join(remoteRoot, 'ansiblePlaybookRoot'), { recursive: true });
    const localSrcDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ansible-sftp-local-'));
    fs.writeFileSync(path.join(localSrcDir, 'site.yml'), 'hosts: all\n', 'utf8');

    const testServer = await startTestSshServer(remoteRoot);
    try {
      const ansibleUtils = loadAnsibleUtils();
      const result = await ansibleUtils.copyFileToRemoteMachine(localSrcDir, '/ansiblePlaybookRoot', connectionConfig(testServer.port));

      assert.strictEqual(result, '0', 'expected upload to succeed when destination directory pre-exists');
      assert.strictEqual(
        fs.readFileSync(path.join(remoteRoot, 'ansiblePlaybookRoot', 'site.yml'), 'utf8'),
        'hosts: all\n',
        'file should still be uploaded into the pre-existing remote directory'
      );
    } finally {
      await testServer.close();
      fs.rmSync(remoteRoot, { recursive: true, force: true });
      fs.rmSync(localSrcDir, { recursive: true, force: true });
    }
  });
});
