FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装 sqlite3 和其他系统依赖
RUN apk add --no-cache sqlite

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 创建必要的目录并设置权限
RUN mkdir -p data && chmod 755 data

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# 启动应用
CMD ["npm", "start"] 