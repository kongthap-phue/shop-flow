#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/aws-build"
STAGE="$OUT/lambda"

rm -rf "$STAGE" "$OUT/shopflow-backend.zip"
mkdir -p "$STAGE/local"
cp -R "$ROOT/backend/src" "$STAGE/src"
cp -R "$ROOT/backend/local/seed-images" "$STAGE/local/"

SHARP_VERSION="$(node -p "require('$ROOT/backend/package.json').dependencies.sharp")"
cat > "$STAGE/package.json" <<JSON
{ "name": "shopflow-lambda", "private": true, "type": "module", "dependencies": { "sharp": "$SHARP_VERSION" } }
JSON

(cd "$STAGE" && npm install --omit=dev --os=linux --cpu=x64 --libc=glibc --no-audit --no-fund)
(cd "$STAGE" && zip -qr "$OUT/shopflow-backend.zip" src local node_modules package.json)

echo "Lambda package: $OUT/shopflow-backend.zip"
