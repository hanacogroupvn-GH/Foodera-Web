import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FUNCTION_NAME = 'cms-translate-zh';
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = scriptDir;
const stagingRoot = resolve(repoRoot, '.supabase-deploy');
const stagingSupabaseRoot = resolve(stagingRoot, 'supabase');
const sourceSupabaseRoot = resolve(repoRoot, 'supabase');

const cleanup = () => {
  rmSync(stagingRoot, { recursive: true, force: true });
};

const stageDeployWorkspace = () => {
  cleanup();
  mkdirSync(resolve(stagingSupabaseRoot, 'functions'), { recursive: true });
  cpSync(resolve(sourceSupabaseRoot, 'config.toml'), resolve(stagingSupabaseRoot, 'config.toml'));
  cpSync(
    resolve(sourceSupabaseRoot, 'functions', FUNCTION_NAME),
    resolve(stagingSupabaseRoot, 'functions', FUNCTION_NAME),
    { recursive: true }
  );
};

const run = async () => {
  stageDeployWorkspace();

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const forwardedArgs = process.argv.slice(2);
  const args = [
    'supabase',
    'functions',
    'deploy',
    FUNCTION_NAME,
    '--no-verify-jwt',
    '--use-api',
    '--workdir',
    stagingRoot,
    ...forwardedArgs
  ];

  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit'
    });

    child.on('error', rejectPromise);
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`Supabase deploy exited with code ${code ?? 1}.`));
    });
  });
};

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'CMS translation deploy failed.');
    process.exitCode = 1;
  })
  .finally(() => {
    cleanup();
  });
