import fs from 'node:fs/promises';
import path from 'node:path';

const parseEnvFile = (content) =>
  Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separatorIndex = line.indexOf('=');
        if (separatorIndex === -1) {
          return [line, ''];
        }

        const key = line.slice(0, separatorIndex).trim();
        let value = line.slice(separatorIndex + 1).trim();
        value = value.replace(/^['"]|['"]$/g, '');
        return [key, value];
      })
  );

export const loadProjectEnv = async (projectRoot) => {
  const lockedKeys = new Set(Object.keys(process.env));
  const fileLoadedKeys = new Set();

  for (const fileName of ['.env', '.env.local']) {
    try {
      const content = await fs.readFile(path.join(projectRoot, fileName), 'utf8');
      const parsed = parseEnvFile(content);
      for (const [key, value] of Object.entries(parsed)) {
        if (lockedKeys.has(key)) {
          continue;
        }

        if (fileName === '.env.local' && fileLoadedKeys.has(key)) {
          process.env[key] = value;
          continue;
        }

        if (!process.env[key]) {
          process.env[key] = value;
          fileLoadedKeys.add(key);
        }
      }
    } catch {
      // ignore missing env file
    }
  }
};
