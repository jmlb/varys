#!/usr/bin/env bash
# deploy.sh — build the Varys frontend and install it into all known envs.
# Usage:  ./deploy.sh          (frontend only)
#         ./deploy.sh --full   (frontend + Python backend files)
set -e

PYRHENV="/home/jmlb/pyrhenv"
VARYSENV="/media/jmlb/datastore-8tb1/.varys"
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

# Deploy static bundle to all envs that have Varys installed
for ENV in "$PYRHENV" "$VARYSENV"; do
  LAB_STATIC="$ENV/share/jupyter/labextensions/varys/static"
  PKG_STATIC="$ENV/lib/python3.12/site-packages/varys/labextension/static"
  if [[ -d "$LAB_STATIC" ]]; then
    cp "$STATIC_SRC"/* "$LAB_STATIC/"
    cp "$STATIC_SRC"/* "$PKG_STATIC/"
    echo "    Copied static files → $ENV"
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
  fi
done

if [[ "$1" == "--full" ]]; then
    echo "==> Deploying Python backend files..."
    for ENV in "$PYRHENV" "$VARYSENV"; do
      SPKG="$ENV/lib/python3.12/site-packages/varys"
      if [[ -d "$SPKG" ]]; then
        cp "$SRC/varys/handlers/task.py"        "$SPKG/handlers/task.py"
        cp "$SRC/varys/handlers/settings.py"    "$SPKG/handlers/settings.py"
        cp "$SRC/varys/llm/client.py"           "$SPKG/llm/client.py"
        cp "$SRC/varys/llm/factory.py"          "$SPKG/llm/factory.py"
        cp "$SRC/varys/llm/bedrock_provider.py" "$SPKG/llm/bedrock_provider.py"
        cp "$SRC/varys/app.py"                  "$SPKG/app.py"
        echo "    Backend files deployed to $ENV"
      fi
    done
    echo ""
    echo "==> Restarting JupyterLab (pyrhenv, port 8702)..."
    pkill -f "pyrhenv/bin/python3.*jupyter-lab" 2>/dev/null || true
    sleep 1
    nohup jupyter-lab --port 8702 --no-browser > /tmp/jupyterlab_varys.log 2>&1 &
    sleep 6
    grep "running at" /tmp/jupyterlab_varys.log && echo "JupyterLab restarted OK"
    echo ""
    echo "NOTE: Restart the .varys JupyterLab (port 8901) manually if it is running."
else
    echo ""
    echo "Done. Hard-refresh the browser (Ctrl+Shift+R) to load the new bundle."
    echo "If using the .varys env (port 8901), restart JupyterLab there too."
fi
