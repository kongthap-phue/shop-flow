#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 3 ]; then
  echo "usage: aws/build-web.sh <invoke-url> <user-pool-id> <app-client-id>"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/aws-build"

rm -rf "$OUT/web" "$OUT/shopflow-web.zip"
mkdir -p "$OUT"
(
  cd "$ROOT/frontend"
  VITE_API_URL="${1%/}" VITE_COGNITO_USER_POOL_ID="$2" VITE_COGNITO_CLIENT_ID="$3" npx vite build --outDir "$OUT/web" --emptyOutDir
)
(cd "$OUT/web" && zip -qr "$OUT/shopflow-web.zip" .)

echo "Website package: $OUT/shopflow-web.zip"
