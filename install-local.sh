#!/bin/sh

set -e

if [ "${1:-}" = "--uninstall" ]; then
  BIN_DIR="${FORGEKIT_BIN_DIR:-$HOME/.local/bin}"
  rm -f "$BIN_DIR/forgekit" "$BIN_DIR/forgekit-mcp"
  echo "✅ Đã gỡ bỏ symlink của forgekit khỏi $BIN_DIR"
  exit 0
fi

echo "🚀 Bắt đầu cài đặt Forgekit local..."

echo "📦 Đang cài đặt dependencies..."
pnpm install

echo "🛠️ Đang build project..."
pnpm run build

echo "🔗 Đang link package vào ~/.local/bin..."
BIN_DIR="${FORGEKIT_BIN_DIR:-$HOME/.local/bin}"
mkdir -p "$BIN_DIR"

ln -sf "$(pwd)/bin/forgekit.mjs" "$BIN_DIR/forgekit"
ln -sf "$(pwd)/bin/forgekit-mcp.mjs" "$BIN_DIR/forgekit-mcp"
chmod +x ./bin/*.mjs

echo "✅ Đã link $BIN_DIR/forgekit và $BIN_DIR/forgekit-mcp thành công!"
echo "💡 Bạn có thể sử dụng các lệnh 'forgekit' và 'forgekit-mcp' ở bất kỳ đâu trên terminal của bạn."
