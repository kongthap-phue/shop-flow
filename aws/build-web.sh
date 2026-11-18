#!/usr/bin/env bash
set -euo pipefail
if [ $# -ne 3 ]; then
  echo "usage: aws/build-web.sh <invoke-url> <user-pool-id> <app-client-id>"
  exit 1
fi
cd "$(dirname "$0")"
node build-web.mjs "$1" "$2" "$3"
