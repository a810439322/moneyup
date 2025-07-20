// API 数据库管理类 - 使用后端 API
class ApiDatabase {
  constructor() {
    // 统一使用相对路径，由Vite代理或Nginx处理
    this.apiBase = '/api'
  }

  // 初始化数据库 - API 版本不需要初始化
  async init() {
    try {
      // 检查后端健康状态
      const response = await fetch(`${this.apiBase}/health`)
      if (!response.ok) {
        throw new Error('后端服务不可用')
      }
      console.log('API 数据库连接成功')
    } catch (error) {
      console.error('API 数据库连接失败:', error)
      throw error
    }
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.apiBase}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '请求失败')
      }
      
      // 检查是否是文件下载
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        return response
      }
    } catch (error) {
      console.error('API 请求失败:', error)
      throw error
    }
  }

  // 资产相关方法
  async getAssets() {
    try {
      console.log('从 API 获取资产数据...')
      const result = await this.request('/assets')
      console.log('API 返回资产数据:', result)
      return result
    } catch (error) {
      console.error('获取资产数据失败:', error)
      return []
    }
  }

  async addAsset(asset) {
    try {
      const result = await this.request('/assets', {
        method: 'POST',
        body: JSON.stringify(asset)
      })
      return true
    } catch (error) {
      console.error('添加资产失败:', error)
      return false
    }
  }

  async updateAsset(asset) {
    try {
      const result = await this.request(`/assets/${asset.id}`, {
        method: 'PUT',
        body: JSON.stringify(asset)
      })
      return true
    } catch (error) {
      console.error('更新资产失败:', error)
      return false
    }
  }

  async deleteAsset(assetId) {
    try {
      await this.request(`/assets/${assetId}`, {
        method: 'DELETE'
      })
      return true
    } catch (error) {
      console.error('删除资产失败:', error)
      return false
    }
  }

  // 标签相关方法
  async getTags() {
    try {
      const result = await this.request('/tags')
      return result
    } catch (error) {
      console.error('获取标签失败:', error)
      return []
    }
  }

  async addTag(tag) {
    try {
      await this.request('/tags', {
        method: 'POST',
        body: JSON.stringify(tag)
      })
      return true
    } catch (error) {
      console.error('添加标签失败:', error)
      return false
    }
  }

  async updateTag(tag) {
    try {
      await this.request(`/tags/${tag.id}`, {
        method: 'PUT',
        body: JSON.stringify(tag)
      })
      return true
    } catch (error) {
      console.error('更新标签失败:', error)
      return false
    }
  }

  async deleteTag(tagId) {
    try {
      await this.request(`/tags/${tagId}`, {
        method: 'DELETE'
      })
      return true
    } catch (error) {
      console.error('删除标签失败:', error)
      return false
    }
  }

  // 历史记录相关方法
  async getHistory() {
    try {
      const result = await this.request('/history')
      return result
    } catch (error) {
      console.error('获取历史记录失败:', error)
      return []
    }
  }

  // 统计方法
  async getTotalAssets() {
    try {
      const assets = await this.getAssets()
      return assets.reduce((total, asset) => total + (asset.amount || 0), 0)
    } catch (error) {
      console.error('获取总资产失败:', error)
      return 0
    }
  }

  async getAssetsByTag(tagId) {
    try {
      const result = await this.request(`/assets/by-tag/${tagId}`)
      return result
    } catch (error) {
      console.error('按标签获取资产失败:', error)
      return []
    }
  }



  // 清空所有数据
  async clearAllData() {
    try {
      await this.request('/clear', {
        method: 'DELETE'
      })
      return true
    } catch (error) {
      console.error('清空数据失败:', error)
      return false
    }
  }


}

// 创建数据库实例
const db = new ApiDatabase()

// 初始化数据库
export async function initDatabase() {
  try {
    console.log('开始初始化 API 数据库...')
    await db.init()
    console.log('API 数据库初始化完成')
  } catch (error) {
    console.error('API 数据库初始化失败:', error)
    // 如果 API 不可用，显示错误信息
    throw error
  }
}

// 导出数据库实例
export default db 