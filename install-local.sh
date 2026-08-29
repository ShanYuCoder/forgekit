#!/bin/bash

set -e

echo "🚀 Bắt đầu cài đặt Forgekit local..."

echo "📦 Đang cài đặt dependencies..."
npm install

echo "🛠️ Đang build project..."
npm run build

echo "🔗 Đang link package..."
npm link

echo "✅ Cài đặt Forgekit local thành công!"
echo "💡 Bạn có thể sử dụng các lệnh 'forgekit' và 'forgekit-mcp' ở bất kỳ đâu trên terminal của bạn."
