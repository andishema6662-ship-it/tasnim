#!/usr/bin/env node
/**
 * Builds a complete offline portable package for Windows x64.
 * Prefer electron-builder win-unpacked when present; otherwise stage a
 * "portable payload" zip with UI + OCR + installer sources for Windows ISCC.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'Output');
const stage = join(outDir, 'ArchiveOCR_Offline_v1.0.0');

mkdirSync(outDir, { recursive: true });
if (existsSync(stage)) rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });

function copyIf(src, dest) {
  if (!existsSync(src)) return false;
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
  return true;
}

// Ensure UI built
if (!existsSync(join(root, 'dist', 'index.html'))) {
  console.log('Building UI...');
  execSync('npm run build:ui', { cwd: root, stdio: 'inherit' });
}

const winUnpacked = join(root, 'dist-electron', 'win-unpacked');
let mode = 'payload';

if (existsSync(join(winUnpacked, 'ArchiveOCR.exe'))) {
  mode = 'win-unpacked';
  cpSync(winUnpacked, join(stage, 'app'), { recursive: true });
} else {
  // Stage app payload for Windows machine to finish with electron-builder + ISCC
  copyIf(join(root, 'dist'), join(stage, 'app', 'dist'));
  copyIf(join(root, 'electron'), join(stage, 'app', 'electron'));
  copyIf(join(root, 'package.json'), join(stage, 'app', 'package.json'));
}

copyIf(join(root, 'ocr_models'), join(stage, 'ocr_models'));
copyIf(join(root, 'installer'), join(stage, 'installer'));
copyIf(join(root, 'LICENSE_FA.txt'), join(stage, 'LICENSE_FA.txt'));
copyIf(join(root, 'scripts', 'build-installer.bat'), join(stage, 'build-installer.bat'));
copyIf(join(root, 'resources'), join(stage, 'resources'));
copyIf(join(root, 'README.md'), join(stage, 'README.md'));

writeFileSync(
  join(stage, 'OFFLINE_README.txt'),
  `سندبان Archive OCR — بسته آفلاین v1.0.0
حالت بسته‌بندی: ${mode}

روی ویندوز x64 (با Node.js + Inno Setup 6):
  1) این پوشه را کپی کنید
  2) اگر app\\ArchiveOCR.exe موجود نیست: در پوشه منبع پروژه scripts\\build-installer.bat را اجرا کنید
  3) خروجی نهایی: Output\\ArchiveOCR_Setup_v1.0.0.exe

محتویات آفلاین:
  - رابط فارسی RTL + SQLite محلی
  - tessdata فارسی (fas.traineddata)
  - منابع Inno Setup (ArchiveApp.iss + Persian.isl)
`,
  'utf8',
);

const zipPath = join(outDir, 'ArchiveOCR_Offline_v1.0.0.zip');
if (existsSync(zipPath)) rmSync(zipPath);

try {
  execSync(`cd "${outDir}" && zip -r -q "ArchiveOCR_Offline_v1.0.0.zip" "ArchiveOCR_Offline_v1.0.0"`, {
    stdio: 'inherit',
    shell: '/bin/bash',
  });
} catch {
  // fallback: tar.gz if zip missing
  execSync(
    `tar -C "${outDir}" -czf "${join(outDir, 'ArchiveOCR_Offline_v1.0.0.tar.gz')}" "ArchiveOCR_Offline_v1.0.0"`,
    { stdio: 'inherit' },
  );
}

function sha256(file) {
  if (!existsSync(file)) return null;
  const hash = createHash('sha256');
  hash.update(readFileSync(file));
  return hash.digest('hex');
}

const artifact =
  existsSync(zipPath) ? zipPath : join(outDir, 'ArchiveOCR_Offline_v1.0.0.tar.gz');
const digest = sha256(artifact);
const size = statSync(artifact).size;
writeFileSync(
  join(outDir, 'SHA256SUMS.txt'),
  `${digest}  ${artifact.split('/').pop()}  (${size} bytes)\n`,
  'utf8',
);

console.log(`Offline package: ${artifact}`);
console.log(`SHA-256: ${digest}`);
console.log(`Mode: ${mode}`);
