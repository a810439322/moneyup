# 家庭资产记录管理系统

一个基于Vue3开发的本地家庭资产记录管理系统，支持资产管理、标签筛选、数据统计和可视化展示。

## 功能特性

### 🏠 资产管理
- **资产添加**: 支持添加各种类型的家庭资产
- **资产编辑**: 修改资产信息和金额（弹窗编辑）
- **资产删除**: 安全删除不需要的资产记录
- **标签分类**: 按类型对资产进行分类管理
- **更新时间**: 显示每个资产的最近更新时间

### 📊 数据统计
- **总资产统计**: 实时显示家庭总资产金额
- **资产分布图**: 饼图展示各类资产占比
- **变化趋势图**: 折线图显示资产变化趋势
- **月度变化**: 显示本月资产变化情况
- **历史记录**: 查看资产操作历史

### 🏷️ 标签管理
- **自定义标签**: 创建个性化的资产分类标签
- **颜色标识**: 为每个标签设置不同颜色
- **标签筛选**: 按标签快速筛选资产
- **标签编辑**: 修改标签名称和颜色

### 💾 数据管理
- **数据持久化**: SQLite 数据库文件外部挂载
- **数据备份**: 直接复制 SQLite 数据库文件
- **数据恢复**: 替换 SQLite 数据库文件并重启服务
- **历史记录**: 完整的操作历史追踪
- **数据备份**: 支持文件级别备份和恢复

### 📱 用户体验
- **响应式设计**: 适配手机和桌面设备
- **现代化UI**: 简洁美观的用户界面
- **流畅交互**: 平滑的页面切换和动画效果
- **直观操作**: 简单易用的操作流程
- **紧凑布局**: 优化空间利用，一屏显示更多内容

## 技术栈

### 前端
- **前端框架**: Vue 3
- **构建工具**: Vite
- **图表绘制**: ECharts
- **样式**: CSS3 + 响应式设计

### 后端 (Docker 版本)
- **后端框架**: Node.js + Express
- **数据存储**: SQLite (支持外部挂载)
- **容器化**: Docker + Docker Compose
- **Web服务器**: Nginx

### 数据存储
- **数据库**: SQLite (文件数据库，支持外部挂载)
- **API架构**: 前后端分离，RESTful API

## 项目结构

```
moneyup/
├── backend/               # 后端 API 服务
│   ├── server.js         # Express 服务器
│   ├── package.json      # 后端依赖配置
│   └── Dockerfile        # 后端容器配置
├── pages/                # 前端页面组件
│   └── index/            # 主页面（资产列表）
├── utils/                # 工具类
│   ├── database.js       # IndexedDB 数据库管理
│   └── api-database.js   # API 数据库管理
├── data/                 # 数据库文件目录 (Docker)
│   └── moneyup.db        # SQLite 数据库文件
├── uploads/              # 上传文件临时目录
├── App.vue              # 主应用组件
├── main.js              # 应用入口
├── nginx.conf           # Nginx 配置
├── frontend.Dockerfile         # 前端容器配置
├── build-and-push.sh           # 镜像构建推送脚本
├── docker-compose.prod.yml     # Docker部署配置
├── DOCKER_DEPLOY.md            # Docker 部署指南
└── README.md                   # 项目说明
```

## 快速开始

### 🐳 Docker 部署 (推荐)

#### 环境要求
- Docker (≥ 20.0)
- Docker Compose (≥ 2.0)

#### 🏗️ 构建和推送镜像
```bash
# 设置你的 Docker Hub 用户名，然后构建推送
DOCKER_USERNAME=your-username ./build-and-push.sh
```

#### 🚀 部署应用
```bash
# 下载配置文件
curl -O https://raw.githubusercontent.com/your-repo/moneyup/main/docker-compose.prod.yml

# 启动服务
mkdir -p data
docker-compose -f docker-compose.prod.yml up -d

# 访问应用: http://localhost
```

#### 数据管理
- **数据库文件**: `./data/moneyup.db` (外部挂载)
- **备份数据**: `cp data/moneyup.db backup/backup_$(date +%Y%m%d).db`
- **恢复数据**: `cp backup/backup_20231201.db data/moneyup.db && docker-compose restart backend`
- **查看数据**: `sqlite3 data/moneyup.db`
- **查看日志**: `docker-compose logs -f`

详细说明请查看：[Docker 部署指南](DOCKER_DEPLOY.md)

### 💻 本地开发

#### 环境要求
- Node.js 16.0+
- npm 或 yarn

#### 手动启动
1. **启动后端服务**:
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **启动前端服务**:
   ```bash
   npm install
   npm run dev
   ```

3. **访问应用**: http://localhost:3000

#### 构建生产版本
```bash
npm run build
```

## 使用说明

### 1. 添加资产
1. 在主页点击"➕"按钮
2. 填写资产名称、金额和类型
3. 可选择添加备注信息
4. 点击"确定"保存

### 2. 编辑资产
1. 在资产列表中点击资产项目或编辑按钮
2. 在弹窗中修改相关信息
3. 点击"保存"完成编辑
4. 如需删除，点击弹窗中的"删除"按钮

### 3. 查看统计
1. 点击底部导航"统计"
2. 查看总资产、分布图和趋势图
3. 切换时间周期查看不同时间段的数据

### 4. 管理标签
1. 点击底部导航"设置"
2. 在"标签管理"区域添加、编辑或删除标签
3. 为标签选择合适的颜色

### 5. 数据备份
1. 在设置页面点击"导出数据库"
2. 选择保存位置下载JSON文件
3. 需要恢复时点击"导入数据库"选择文件

### 6. 查看历史
1. 在主页面点击"📋"按钮
2. 查看所有资产操作历史记录
3. 包括添加、更新、删除操作

## 数据格式

### 资产数据结构
```json
{
  "id": "唯一标识",
  "name": "资产名称",
  "amount": 10000,
  "tagId": "标签ID",
  "remark": "备注信息",
  "createTime": "创建时间",
  "updateTime": "更新时间"
}
```

### 标签数据结构
```json
{
  "id": "唯一标识",
  "name": "标签名称",
  "color": "#007AFF"
}
```

### 历史记录结构
```json
{
  "id": "唯一标识",
  "type": "操作类型(add/update/delete)",
  "assetId": "资产ID",
  "amount": "涉及金额",
  "description": "操作描述",
  "time": "操作时间"
}
```

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 主要改进

### v1.1.0 (最新版本)
- ✨ **界面优化**: 更紧凑的布局设计，一屏显示更多内容
- 🎯 **编辑优化**: 编辑功能改为弹窗模式，删除按钮集成到编辑弹窗
- 📅 **时间显示**: 每个资产项显示最近更新时间
- 📋 **历史记录**: 新增历史记录查看功能
- 🗄️ **数据库升级**: 从localStorage升级到IndexedDB
- 🚫 **功能精简**: 移除不必要的清空功能
- 📊 **数据管理**: 优化导入导出功能描述

### v1.0.0 (初始版本)
- 🎯 基础资产管理功能
- 📊 数据可视化图表
- 🏷️ 标签分类系统
- 💾 数据导入导出功能

## 注意事项

1. **数据持久化**: SQLite数据库文件外部挂载到 `./data/` 目录
2. **备份策略**: 定期备份 `./data/moneyup.db` 文件
3. **端口配置**: 
   - 前端开发服务器: 3000
   - 后端API服务器: 3001
   - Docker前端服务: 80
4. **服务依赖**: 前端依赖后端API服务，需要先启动后端

## 开发计划

### 已完成
- [x] Docker 容器化部署
- [x] SQLite 数据库支持
- [x] 外部数据挂载
- [x] 一键部署脚本
- [x] API 服务架构
- [x] Docker 镜像发布
- [x] Docker 部署配置
- [x] 移除JSON导入导出功能

### 计划中
- [ ] 支持多账户管理
- [ ] 添加数据加密功能
- [ ] 支持云端同步
- [ ] 添加更多图表类型
- [ ] 支持数据导出为Excel
- [ ] 添加资产提醒功能
- [ ] 支持数据备份到云端
- [ ] HTTPS 支持
- [ ] 集群部署支持

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目。

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过GitHub Issues联系。 