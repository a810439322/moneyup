import { createApp } from 'vue'
import App from './App.vue'

// 模拟uni-app的API
const uni = {
  getStorageSync: (key) => {
    try {
      return JSON.parse(localStorage.getItem(key))
    } catch (e) {
      return null
    }
  },
  setStorageSync: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (e) {
      return false
    }
  },
  showToast: (options) => {
    alert(options.title)
  },
  showModal: (options) => {
    const result = confirm(options.content)
    if (options.success) {
      options.success({ confirm: result })
    }
  },
  navigateTo: (options) => {
    window.location.hash = options.url
  },
  navigateBack: () => {
    window.history.back()
  },
  stopPullDownRefresh: () => {
    // 模拟下拉刷新停止
  },
  createCanvasContext: (canvasId, context) => {
    // 模拟canvas上下文
    return {
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      arc: () => {},
      closePath: () => {},
      setFillStyle: () => {},
      fill: () => {},
      setStrokeStyle: () => {},
      setLineWidth: () => {},
      lineTo: () => {},
      stroke: () => {},
      setFontSize: () => {},
      fillText: () => {},
      draw: () => {}
    }
  }
}

// 将uni对象挂载到全局
window.uni = uni

// 创建Vue应用并挂载
const app = createApp(App)
app.mount('#app') 