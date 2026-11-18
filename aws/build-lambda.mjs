import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipPaths } from './zip.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'aws-build');
const STAGE = path.join(OUT, 'lambda');
const ZIP = path.join(OUT, 'shopflow-backend.zip');
const isWindows = process.platform === 'win32';

rmSync(STAGE, { recursive: true, force: true });
rmSync(ZIP, { force: true });
mkdirSync(path.join(STAGE, 'local'), { recursive: true });
cpSync(path.join(ROOT, 'backend', 'src'), path.join(STAGE, 'src'), { recursive: true });
cpSync(path.join(ROOT, 'backend', 'local', 'seed-images'), path.join(STAGE, 'local', 'seed-images'), { recursive: true });

const { dependencies } = JSON.parse(readFileSync(path.join(ROOT, 'backend', 'package.json'), 'utf8'));
writeFileSync(
  path.join(STAGE, 'package.json'),
  JSON.stringify({ name: 'shopflow-lambda', private: true, type: 'module', dependencies: { sharp: dependencies.sharp } }, null, 2),
);

const args = ['install', '--omit=dev', '--os=linux', '--cpu=x64', '--libc=glibc', '--no-audit', '--no-fund'];
const npm = spawnSync('npm', args, { cwd: STAGE, stdio: 'inherit', shell: isWindows });
if (npm.status !== 0) {
  console.error('npm install failed. Make sure Node.js 20 or later is installed.');
  process.exit(npm.status ?? 1);
}

const count = zipPaths(STAGE, ['src', 'local', 'node_modules', 'package.json'], ZIP);
console.log(`Lambda package: ${ZIP} (${count} files)`);
