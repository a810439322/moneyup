<template>
  <div id="app">
    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 页面内容 -->
      <div class="page-container">
        <IndexPage v-if="dbInitialized" @navigate="handleNavigate" />
        <div v-else class="loading">
          <div class="loading-text">正在初始化数据库...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { initDatabase } from './utils/api-database.js'
import db from './utils/api-database.js'
import IndexPage from './pages/index/index.vue'

export default {
  name: 'App',
  components: {
    IndexPage
  },
  data() {
    return {
      dbInitialized: false
    }
  },
  async mounted() {
    // 初始化SQLite数据库
    try {
      console.log('开始初始化 SQLite 数据库...')
      
      // 设置全局数据库实例
      window.appDatabase = db
      
      await initDatabase()
      console.log('SQLite 数据库初始化成功')
      this.dbInitialized = true
    } catch (error) {
      console.error('SQLite 数据库初始化失败:', error)
      console.log('请确保后端服务正在运行')
      // 即使初始化失败，也设置为true，让页面能够显示
      this.dbInitialized = true
    }
  },
  methods: {
    handleNavigate(navigation) {
      console.log('Navigation:', navigation)
    }
  }
}
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  background-color: #f8f8f8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  height: 100%;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  overflow-y: auto;
}

.page-container {
  min-height: 100%;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f8f8f8;
}

.loading-text {
  font-size: 18px;
  color: #666;
  text-align: center;
}

/* 通用按钮样式 */
.btn-primary {
  background: #007AFF;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.btn-primary:hover {
  background: #0056CC;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-danger {
  background: #FF3B30;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.btn-danger:hover {
  background: #d70015;
}

/* 卡片样式 */
.card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.form-group textarea {
  height: 80px;
  resize: vertical;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #f0f0f0;
}
</style> 