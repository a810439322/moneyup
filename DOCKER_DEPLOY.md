# 🐳 Docker 部署指南

## 📋 系统要求

- Docker (≥ 20.0)
- Docker Compose (≥ 2.0)

## 🏗️ 构建和推送镜像

### 1. 修改配置
编辑 `build-and-push.sh`，将 `your-dockerhub-username` 替换为您的 Docker Hub 用户名。

### 2. 登录 Docker Hub
```bash
docker login
```

### 3. 构建和推送
```bash
chmod +x build-and-push.sh
DOCKER_USERNAME=your-username ./build-and-push.sh
```

## 🚀 部署应用

### 方法一：下载配置文件部署
```bash
# 下载配置文件
curl -O https://raw.githubusercontent.com/your-repo/moneyup/main/docker-compose.prod.yml

# 创建数据目录
mkdir -p data

# 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

### 方法二：直接使用配置
创建 `docker-compose.yml` 文件：
```yaml
version: '3.8'

services:
  backend:
    image: your-username/moneyup-backend:latest
    container_name: moneyup-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production

  frontend:
    image: your-username/moneyup-frontend:latest
    container_name: moneyup-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
```

然后启动：
```bash
mkdir -p data
docker-compose up -d
```

## 🌐 访问应用

- **前端**: http://localhost
- **后端 API**: http://localhost:3001

## 📊 管理命令

```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新到最新版本
docker-compose pull && docker-compose up -d
```

## 💾 数据管理

### 备份数据
```bash
cp data/moneyup.db backup_$(date +%Y%m%d).db
```

### 恢复数据
```bash
cp backup_20231201.db data/moneyup.db
docker-compose restart backend
```

### 查看数据库
```bash
sqlite3 data/moneyup.db
```

## 🛠️ 故障排除

### 端口冲突
```bash
# 检查端口占用
netstat -tulpn | grep :80
netstat -tulpn | grep :3001

# 修改端口（编辑 docker-compose.yml）
ports:
  - "8080:80"    # 前端改为8080端口
  - "8001:3001"  # 后端改为8001端口
```

### 服务启动失败
```bash
# 查看详细日志
docker-compose logs backend
docker-compose logs frontend

# 重新部署
docker-compose down
docker-compose up -d
```

---

**就是这么简单！** 🎉 