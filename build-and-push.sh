#!/bin/bash

# MoneyUp Docker 镜像构建和推送脚本

set -e

# 配置变量 (请修改为您的 Docker Hub 用户名)
DOCKER_USERNAME=${DOCKER_USERNAME:-"your-dockerhub-username"}
APP_NAME="moneyup"
VERSION=${VERSION:-"latest"}

echo "🐳 构建和推送 MoneyUp Docker 镜像"
echo "=================================="
echo "Docker用户名: $DOCKER_USERNAME"
echo "版本标签: $VERSION"
echo "=================================="

# 检查 Docker
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker 未运行"
    exit 1
fi

echo "📦 构建后端镜像..."
docker build \
    --tag "$DOCKER_USERNAME/$APP_NAME-backend:$VERSION" \
    --tag "$DOCKER_USERNAME/$APP_NAME-backend:latest" \
    --file backend/Dockerfile \
    backend/

echo "📦 构建前端镜像..."
docker build \
    --tag "$DOCKER_USERNAME/$APP_NAME-frontend:$VERSION" \
    --tag "$DOCKER_USERNAME/$APP_NAME-frontend:latest" \
    --file frontend.Dockerfile \
    .

echo "✅ 镜像构建完成"

# 推送镜像
read -p "是否推送镜像到Docker Hub? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 推送镜像..."
    docker push "$DOCKER_USERNAME/$APP_NAME-backend:$VERSION"
    docker push "$DOCKER_USERNAME/$APP_NAME-backend:latest"
    docker push "$DOCKER_USERNAME/$APP_NAME-frontend:$VERSION"
    docker push "$DOCKER_USERNAME/$APP_NAME-frontend:latest"
    
    echo "✅ 镜像推送完成"
    echo ""
    echo "🎯 部署方式："
    echo "1. 下载配置: curl -O https://raw.githubusercontent.com/your-repo/moneyup/main/docker-compose.prod.yml"
    echo "2. 启动服务: mkdir -p data && docker-compose -f docker-compose.prod.yml up -d"
    echo "3. 访问应用: http://localhost"
else
    echo "⏭️  跳过推送"
fi

echo "🎉 完成！" 