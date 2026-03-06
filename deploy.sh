#!/usr/bin/env bash
# deploy.sh — build the Varys frontend and copy the JS bundle to the .varys env.
# Usage:  ./deploy.sh   (build JS + copy static files)
#
# Python changes are picked up automatically on the next JupyterLab restart
# because .varys uses an editable install pointing at this source tree.
set -e

VARYSENV="/media/jmlb/datastore-8tb1/.varys"
SRC="/media/jmlb/datastore-8tb1/my_ideas/varys"

source "$VARYSENV/bin/activate"
cd "$SRC"

echo "==> Compiling TypeScript..."
npx tsc

echo "==> Building webpack bundle..."
jupyter labextension build .

STATIC_SRC="$SRC/varys/labextension/static"
REMOTE_ENTRY=$(ls "$STATIC_SRC"/remoteEntry.*.js | xargs basename)
echo "==> New remoteEntry: $REMOTE_ENTRY"

LAB_STATIC="$VARYSENV/share/jupyter/labextensions/varys/static"
PKG_STATIC="$VARYSENV/lib/python3.12/site-packages/varys/labextension/static"

cp "$STATIC_SRC"/* "$LAB_STATIC/"
cp "$STATIC_SRC"/* "$PKG_STATIC/"
echo "    Copied static files → $VARYSENV"

python3 - <<PYEOF
import json
new_load = "static/$REMOTE_ENTRY"
for path in [
    "$LAB_STATIC/../package.json",
    "$PKG_STATIC/../package.json",
]:
    with open(path) as f:
        d = json.load(f)
    d["jupyterlab"]["_build"]["load"] = new_load
    with open(path, "w") as f:
        json.dump(d, f, indent=2)
    print(f"    Updated {path} -> {new_load}")
PYEOF

echo ""
echo "Done. Hard-refresh the browser (Ctrl+Shift+R)."
echo "If Python files changed, restart JupyterLab first."
