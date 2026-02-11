#!/bin/bash
# Crypto Hunter 快速启动脚本

echo "🐂 Crypto Hunter 启动中..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js 14+"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 导出环境变量（如果有）
if [ -f ".env" ]; then
    export $(cat .env | xargs)
fi

# 启动监控
echo "🔍 启动加密货币监控..."
node index.js

echo "✅ 完成！"
