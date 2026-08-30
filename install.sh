#!/usr/bin/env bash
# forgekit installer (Linux / WSL) — git clone + npm/pnpm build (needs Node ≥ 22).
#
#   curl -fsSL https://raw.githubusercontent.com/ShanYuCoder/forgekit/main/install.sh | bash
#
# Upgrade: re-run the same command.
# Uninstall: bash install.sh --uninstall
#
# Env:
#   FORGEKIT_REPO          default: ShanYuCoder/forgekit
#   FORGEKIT_INSTALL_DIR   default: ~/.forgekit-cli
#   FORGEKIT_BIN_DIR       default: ~/.local/bin
#   FORGEKIT_REF           git ref (default: main)
set -euo pipefail

REPO="${FORGEKIT_REPO:-ShanYuCoder/forgekit}"
INSTALL_DIR="${FORGEKIT_INSTALL_DIR:-$HOME/.forgekit-cli}"
BIN_DIR="${FORGEKIT_BIN_DIR:-$HOME/.local/bin}"

if [ -z "${FORGEKIT_REF:-}" ]; then
  LATEST_TAG=$(git ls-remote --tags --sort="v:refname" "https://github.com/$REPO.git" | grep -v "\^{}" | tail -n1 | awk -F/ '{print $3}')
  if [ -n "$LATEST_TAG" ]; then
    REF="$LATEST_TAG"
  else
    REF="main"
  fi
else
  REF="$FORGEKIT_REF"
fi

if [ "${1:-}" = "--uninstall" ]; then
  rm -f "$BIN_DIR/forgekit" "$BIN_DIR/forgekit-mcp"
  rm -rf "$INSTALL_DIR"
  
  # Remove path from shell configs
  for rc in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.bash_profile"; do
    if [ -f "$rc" ] && grep -q "# --- forgekit start ---" "$rc"; then
      # Delete lines from start to end marker
      sed -i.bak '/# --- forgekit start ---/,/# --- forgekit end ---/d' "$rc"
      rm -f "${rc}.bak"
      echo "Removed forgekit PATH from $rc"
    fi
  done
  
  echo "forgekit uninstalled ($INSTALL_DIR)."
  exit 0
fi

if ! command -v node >/dev/null 2>&1; then
  echo "forgekit: Node.js ≥ 22 required (node not found)." >&2
  exit 1
fi
if ! command -v git >/dev/null 2>&1; then
  echo "forgekit: git required." >&2
  exit 1
fi

echo "Installing forgekit from github.com/$REPO @$REF → $INSTALL_DIR"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

git clone --depth 1 --branch "$REF" "https://github.com/$REPO.git" "$tmpdir/src"

rm -rf "$INSTALL_DIR"
mkdir -p "$(dirname "$INSTALL_DIR")"
mv "$tmpdir/src" "$INSTALL_DIR"

cd "$INSTALL_DIR"
if command -v pnpm >/dev/null 2>&1; then
  pnpm install
  pnpm build
elif command -v npm >/dev/null 2>&1; then
  npm install
  npm run build
else
  echo "forgekit: pnpm or npm required." >&2
  exit 1
fi

mkdir -p "$BIN_DIR"
ln -sf "$INSTALL_DIR/bin/forgekit.mjs" "$BIN_DIR/forgekit"
ln -sf "$INSTALL_DIR/bin/forgekit-mcp.mjs" "$BIN_DIR/forgekit-mcp"
chmod +x "$INSTALL_DIR/bin/"*.mjs

echo "Linked $BIN_DIR/forgekit"

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *)
    echo ""
    echo "$BIN_DIR is not on PATH. Attempting to add to shell config..."
    ADDED=0
    for rc in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.bash_profile"; do
      if [ -f "$rc" ]; then
        if ! grep -q "$BIN_DIR" "$rc"; then
          echo "" >> "$rc"
          echo "# --- forgekit start ---" >> "$rc"
          echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$rc"
          echo "# --- forgekit end ---" >> "$rc"
          echo "  -> Added to $rc"
          ADDED=1
        fi
      fi
    done
    
    if [ "$ADDED" -eq 1 ]; then
      echo "  Please restart your terminal or run 'source ~/.zshrc' (or your respective shell config) to apply."
    else
      echo "  Could not automatically add to shell config. Please add manually:"
      echo "  export PATH=\"$BIN_DIR:\$PATH\""
    fi
    ;;
esac

echo ""
echo "Done. Next:"
echo "  forgekit"
