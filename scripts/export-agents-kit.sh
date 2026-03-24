#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/.artifacts"
VERSION="${1:-0.1.0}"
TAR_NAME="agents-kit-v${VERSION}.tar.gz"
ZIP_NAME="agents-kit-v${VERSION}.zip"

mkdir -p "$OUT_DIR"

tar -czf "$OUT_DIR/$TAR_NAME" -C "$ROOT_DIR" agents

if command -v zip >/dev/null 2>&1; then
  (
    cd "$ROOT_DIR"
    rm -f "$OUT_DIR/$ZIP_NAME"
    zip -qr "$OUT_DIR/$ZIP_NAME" agents
  )
else
  echo "WARN: zip command no disponible; solo se genero TAR.GZ" >&2
fi

echo "Exported: $OUT_DIR/$TAR_NAME"
if [[ -f "$OUT_DIR/$ZIP_NAME" ]]; then
  echo "Exported: $OUT_DIR/$ZIP_NAME"
fi
