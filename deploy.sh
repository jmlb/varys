#!/usr/bin/env bash
# deploy.sh — build the Varys frontend and install it into the pyrhenv JupyterLab.
# Usage:  ./deploy.sh          (frontend only)
#         ./deploy.sh --full   (frontend + Python backend files)
set -e

PYRHENV="/home/jmlb/pyrhenv"
SRC="/media/jmlb/datastore-8tb1/my_ideas/varys"

source "$PYRHENV/bin/activate"
cd "$SRC"

echo "==> Compiling TypeScript..."
npx tsc

echo "==> Building webpack bundle..."
jupyter labextension build .

STATIC_SRC="$SRC/varys/labextension/static"
REMOTE_ENTRY=$(ls "$STATIC_SRC"/remoteEntry.*.js | xargs basename)
echo "==> New remoteEntry: $REMOTE_ENTRY"

for DEST in \
    "$PYRHENV/share/jupyter/labextensions/varys/static" \
    "$PYRHENV/lib/python3.12/site-packages/varys/labextension/static"; do
  cp "$STATIC_SRC"/* "$DEST/"
  echo "    Copied static files → $DEST"
done

python3 - <<PYEOF
import json
new_load = "static/$REMOTE_ENTRY"
for path in [
    "$PYRHENV/share/jupyter/labextensions/varys/package.json",
    "$PYRHENV/lib/python3.12/site-packages/varys/labextension/package.json",
]:
    with open(path) as f:
        d = json.load(f)
    d["jupyterlab"]["_build"]["load"] = new_load
    with open(path, "w") as f:
        json.dump(d, f, indent=2)
    print(f"    Updated {path} -> {new_load}")
PYEOF

if [[ "$1" == "--full" ]]; then
    echo "==> Deploying Python backend files..."
    cp "$SRC/varys/handlers/task.py"        "$PYRHENV/lib/python3.12/site-packages/varys/handlers/task.py"
    cp "$SRC/varys/handlers/settings.py"    "$PYRHENV/lib/python3.12/site-packages/varys/handlers/settings.py"
    cp "$SRC/varys/llm/client.py"           "$PYRHENV/lib/python3.12/site-packages/varys/llm/client.py"
    cp "$SRC/varys/llm/factory.py"          "$PYRHENV/lib/python3.12/site-packages/varys/llm/factory.py"
    cp "$SRC/varys/llm/bedrock_provider.py" "$PYRHENV/lib/python3.12/site-packages/varys/llm/bedrock_provider.py"
    cp "$SRC/varys/app.py"                  "$PYRHENV/lib/python3.12/site-packages/varys/app.py"
    echo "    Backend files deployed."
    echo ""
    echo "==> Restarting JupyterLab (port 8702)..."
    pkill -f "pyrhenv/bin/python3.*jupyter-lab" 2>/dev/null || true
    sleep 1
    nohup jupyter-lab --port 8702 --no-browser > /tmp/jupyterlab_varys.log 2>&1 &
    sleep 6
    grep "running at" /tmp/jupyterlab_varys.log && echo "JupyterLab restarted OK"
else
    echo ""
    echo "Done. Hard-refresh the browser (Ctrl+Shift+R) to load the new bundle."
fi
