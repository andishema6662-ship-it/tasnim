#!/usr/bin/env node
import { createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'ocr_models', 'fas');
const publicDir = join(root, 'public', 'tessdata');

mkdirSync(outDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });

const assets = [
  {
    name: 'fas.traineddata',
    url: 'https://github.com/tesseract-ocr/tessdata_fast/raw/main/fas.traineddata',
  },
  {
    name: 'fas_best.traineddata',
    url: 'https://github.com/tesseract-ocr/tessdata/raw/main/fas.traineddata',
    optional: true,
  },
];

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

for (const asset of assets) {
  const dest = join(outDir, asset.name);
  if (existsSync(dest) && statSync(dest).size > 1000) {
    console.log(`[skip] ${asset.name} already present (${statSync(dest).size} bytes)`);
  } else {
    try {
      console.log(`[get] ${asset.name}`);
      await download(asset.url, dest);
      console.log(`[ok] ${asset.name} -> ${dest}`);
    } catch (err) {
      if (asset.optional) {
        console.warn(`[warn] optional ${asset.name} failed: ${err.message}`);
        continue;
      }
      throw err;
    }
  }
  // Mirror into Vite public for offline tesseract.js langPath=/tessdata
  const pub = join(publicDir, asset.name === 'fas_best.traineddata' ? 'fas_best.traineddata' : asset.name);
  if (existsSync(dest)) {
    const { copyFileSync } = await import('node:fs');
    if (asset.name === 'fas.traineddata') {
      copyFileSync(dest, join(publicDir, 'fas.traineddata'));
    } else if (existsSync(dest)) {
      copyFileSync(dest, pub);
    }
  }
}

console.log('tessdata ready');
