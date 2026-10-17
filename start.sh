#!/usr/bin/env sh
# Serves the app at http://localhost:8765/ (file:// does not work: the page fetches JSON/assets)
cd "$(dirname "$0")/web" || exit 1
URL=http://localhost:8765/
PY=$(command -v python3 || command -v python) || { echo "Python 3 is required." >&2; exit 1; }
(sleep 1; xdg-open "$URL" 2>/dev/null || open "$URL" 2>/dev/null) &
exec "$PY" -m http.server 8765
