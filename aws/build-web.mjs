import { spawnSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipPaths } from './zip.mjs';

const [apiUrl, userPoolId, clientId] = process.argv.slice(2);
if (!clientId) {
  console.error('usage: node aws/build-web.mjs <invoke-url> <user-pool-id> <app-client-id>');
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'aws-build');
const WEB = path.join(OUT, 'web');
const ZIP = path.join(OUT, 'shopflow-web.zip');
const isWindows = process.platform === 'win32';
const quote = (arg) => (isWindows ? `"${arg}"` : arg);

rmSync(ZIP, { force: true });
const env = {
  ...process.env,
  VITE_API_URL: apiUrl.replace(/\/+$/, ''),
  VITE_COGNITO_USER_POOL_ID: userPoolId,
  VITE_COGNITO_CLIENT_ID: clientId,
};
const build = spawnSync('npx', ['vite', 'build', '--outDir', quote(WEB), '--emptyOutDir'], {
  cwd: path.join(ROOT, 'frontend'),
  env,
  stdio: 'inherit',
  shell: isWindows,
});
if (build.status !== 0) {
  console.error('Build failed. Run "npm run setup" in the project folder first.');
  process.exit(build.status ?? 1);
}

const count = zipPaths(WEB, readdirSync(WEB), ZIP);
console.log(`Website package: ${ZIP} (${count} files)`);
