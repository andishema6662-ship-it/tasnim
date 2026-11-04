#!/usr/bin/env bash
# Linux/mac helper: builds UI + offline portable zip.
# Native Setup.exe requires Windows ISCC (or Wine + Inno Setup).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Fetch tessdata if missing"
node scripts/fetch-tessdata.mjs

echo "==> npm install"
npm install
node scripts/fetch-tesseract-runtime.mjs

echo "==> Build UI"
npm run build:ui

echo "==> Pack offline portable bundle (zip)"
node scripts/pack-offline.mjs

if command -v wine >/dev/null 2>&1 && [[ -f "$HOME/.wine/drive_c/Program Files (x86)/Inno Setup 6/ISCC.exe" || -f "/opt/inno/ISCC.exe" ]]; then
  echo "==> Compiling Setup.exe via Wine + ISCC"
  ISCC="${ISCC:-$HOME/.wine/drive_c/Program Files (x86)/Inno Setup 6/ISCC.exe}"
  if [[ ! -f "$ISCC" ]]; then ISCC="/opt/inno/ISCC.exe"; fi
  wine "$ISCC" /Qp "installer/ArchiveApp.iss" || {
    echo "Wine ISCC failed — portable zip is still available under Output/"
    exit 0
  }
else
  echo "NOTE: Wine/ISCC not available. On Windows run: scripts\\build-installer.bat"
  echo "Portable offline zip written under Output/"
fi
