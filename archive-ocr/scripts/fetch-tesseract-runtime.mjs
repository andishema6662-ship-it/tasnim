#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dest = join(root, 'public', 'tesseract');
mkdirSync(dest, { recursive: true });

const files = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-lstm.wasm', 'tesseract-core-lstm.wasm'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm', 'tesseract-core-simd-lstm.wasm'],
];

for (const [from, name] of files) {
  const src = join(root, from);
  if (!existsSync(src)) {
    console.warn(`[skip] missing ${from} — run npm install first`);
    continue;
  }
  cpSync(src, join(dest, name));
  console.log(`[ok] ${name}`);
}

const wasmSrc = join(root, 'node_modules/sql.js/dist/sql-wasm.wasm');
if (existsSync(wasmSrc)) {
  cpSync(wasmSrc, join(root, 'public', 'sql-wasm.wasm'));
  console.log('[ok] sql-wasm.wasm');
}
