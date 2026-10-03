#!/usr/bin/env bash
# Deploy static `out/` to cPanel docroot via shamseh-deploy.zip + do_unzip.php (no secrets in repo).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP_NAME="${DEPLOY_ZIP_NAME:-shamseh-deploy.zip}"
HOST="${CPANEL_HOST:-185.8.174.149}"
USER="${CPANEL_USER:-h430544}"
PASS="${CPANEL_PASS:?Set CPANEL_PASS}"
DOCROOT="${CPANEL_DOCROOT:-/home/h430544/public_html}"
STAGE_ZIP="${ROOT}/tasnim-static-stage.zip"

cd "$ROOT/out"
zip -qr "$STAGE_ZIP" .

curl -sk --max-time 60 -u "${USER}:${PASS}" \
  "https://${HOST}:2083/json-api/cpanel?cpanel_jsonapi_user=${USER}&cpanel_jsonapi_apiversion=2&cpanel_jsonapi_module=Fileman&cpanel_jsonapi_func=fileop&op=trash&sourcefiles=${DOCROOT}/${ZIP_NAME}" \
  >/dev/null || true

DOCROOT_ENC=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${DOCROOT}'))")
UPLOAD_JSON=$(curl -sk --max-time 180 -u "${USER}:${PASS}" \
  -F "file-1=@${STAGE_ZIP};filename=${ZIP_NAME}" \
  "https://${HOST}:2083/execute/Fileman/upload_files?dir=${DOCROOT_ENC}")
echo "$UPLOAD_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('status')==1, d"

SITE="${LIVE_SITE_URL:-https://diyareminoodari.ir}"
UNZIP=$(curl -sk --max-time 300 "${SITE}/do_unzip.php")
echo "$UNZIP"
echo "$UNZIP" | grep -q EXTRACT_OK
