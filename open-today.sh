#!/usr/bin/env bash
# Open today's AI Daily News HTML in the default browser.
# Usage: ./open-today.sh   or  bash open-today.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATE=$(date +%Y-%m-%d)
FILE="${SCRIPT_DIR}/AI_Daily_News_${DATE}.html"
if [[ -f "$FILE" ]]; then
  open "$FILE"
else
  echo "File not found: $FILE"
  exit 1
fi
