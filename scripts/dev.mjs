import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const children = [];
let shuttingDown = false;
const requestedMode = String(process.argv[2] || '').trim().toLowerCase();

const resolvedDatabaseMode =
  requestedMode === 'local' || requestedMode === 'turso' ? requestedMode : undefined;

const shutdown = (code = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => process.exit(code), 150);
};

const spawnTask = (args) => {
  const childCommand = isWindows ? 'cmd.exe' : npmCommand;
  const childArgs = isWindows ? ['/d', '/s', '/c', `${npmCommand} ${args.join(' ')}`] : args;

  const child = spawn(childCommand, childArgs, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
    env: {
      ...process.env,
      ...(resolvedDatabaseMode ? { DATABASE_MODE: resolvedDatabaseMode } : {})
    }
  });

  child.stdout?.on('data', (chunk) => {
    process.stdout.write(chunk);
  });

  child.stderr?.on('data', (chunk) => {
    process.stderr.write(chunk);
  });

  child.on('exit', (code) => {
    if (shuttingDown) {
      return;
    }

    shutdown(code ?? 0);
  });

  children.push(child);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

spawnTask(['run', 'dev:server']);
spawnTask(['run', 'dev:client']);
