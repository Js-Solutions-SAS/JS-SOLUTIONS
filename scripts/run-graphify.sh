#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CRITICAL_PATHS=(
  "portal"
  "api/src"
  "n8n/workflows"
  "agents/marketing"
)

if ! command -v graphify >/dev/null 2>&1; then
  echo "graphify is not installed. Run: uv tool install \"graphifyy[sql]\""
  exit 1
fi

if ! find . -maxdepth 0 -flags +dataless >/dev/null 2>&1; then
  echo "This script expects macOS find with -flags +dataless because the workspace is in iCloud."
  echo "Run graphify manually if you are on a non-macOS filesystem."
  exit 1
fi

dataless_files=()
while IFS= read -r file; do
  dataless_files+=("$file")
done < <(
  find "${CRITICAL_PATHS[@]}" \
    -type f \
    -flags +dataless \
    -not -path '*/node_modules/*' \
    -not -path '*/.vercel/*' \
    -not -path '*/.next/*' \
    -not -path '*/public/*' \
    -not -name '.env*' \
    -not -name 'package-lock.json' \
    -not -name '*.tsbuildinfo' \
    -print 2>/dev/null
)

if [ "${#dataless_files[@]}" -gt 0 ]; then
  echo "Graphify blocked: ${#dataless_files[@]} critical files are still iCloud dataless."
  echo "Download them from Finder first, then rerun this script."
  printf '%s\n' "${dataless_files[@]:0:40}"
  if [ "${#dataless_files[@]}" -gt 40 ]; then
    echo "...and $(( ${#dataless_files[@]} - 40 )) more."
  fi
  exit 2
fi

echo "Running Graphify extraction..."
graphify extract . --out .

echo "Exporting call flow HTML..."
graphify export callflow-html

if [ ! -f graphify-out/GRAPH_REPORT.md ] || [ ! -f graphify-out/graph.json ]; then
  echo "Graphify did not produce required outputs."
  exit 3
fi

echo "Validating required workspace modules in GRAPH_REPORT.md..."
for module in landing admin portal api n8n; do
  if ! grep -qi "$module" graphify-out/GRAPH_REPORT.md; then
    echo "Warning: GRAPH_REPORT.md does not mention '$module'. Review graph quality before using it commercially."
  fi
done

echo "Running lead-flow query..."
graphify query "como fluye un lead desde landing hasta cotizacion y contrato" \
  --budget 2000 > graphify-out/query-lead-flow.txt

echo "Graphify complete:"
echo "  graphify-out/GRAPH_REPORT.md"
echo "  graphify-out/graph.json"
echo "  graphify-out/graph.html"
echo "  graphify-out/query-lead-flow.txt"
