#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Publica la versión COMPILADA del juego en GitHub Pages (rama `gh-pages`).
#
# Uso:   bash deploy.sh
#
# Qué hace:
#   1. Compila el proyecto con Vite  -> carpeta dist/
#   2. Copia dist/ dentro de una carpeta `count-masters/` en una rama limpia
#   3. Hace push forzado de esa rama a `gh-pages` del repositorio
#
# Resultado: https://<org>.github.io/tipan-jonathan-jueg-gr3/count-masters/
#
# IMPORTANTE: en GitHub -> Settings -> Pages, la fuente debe estar configurada
# como:  Branch: gh-pages   /   carpeta: / (root)
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_FOLDER="count-masters"

REMOTE_URL="$(git -C "$REPO_ROOT" remote get-url origin)"
echo "Remoto: $REMOTE_URL"

echo "==> Compilando..."
cd "$SCRIPT_DIR"
npm run build

echo "==> Preparando rama de publicación..."
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$TMP_DIR/$PROJECT_FOLDER"
cp -r "$SCRIPT_DIR/dist/." "$TMP_DIR/$PROJECT_FOLDER/"
touch "$TMP_DIR/.nojekyll"

cat > "$TMP_DIR/index.html" <<'HTML'
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=./count-masters/" />
    <title>Crowd Conquest: Gate Rush</title>
  </head>
  <body>
    <p>Redirigiendo a <a href="./count-masters/">Crowd Conquest: Gate Rush</a>…</p>
  </body>
</html>
HTML

cd "$TMP_DIR"
git init -q -b gh-pages
git add -A
git -c user.name="deploy" -c user.email="deploy@local" \
    commit -q -m "Deploy $(date '+%Y-%m-%d %H:%M')"

echo "==> Publicando en gh-pages..."
git push --force "$REMOTE_URL" gh-pages

echo ""
echo "Listo. Espera 1-2 minutos y recarga:"
echo "  https://2026b-sof-jueg-gr1.github.io/tipan-jonathan-jueg-gr3/count-masters/"
