// 本地数据库管理类 - 使用IndexedDB
class Database {
  constructor() {
    this.dbName = 'FamilyAssetsDB'
    this.dbVersion = 1
    this.db = null
    this.assetsStore = 'assets'
    this.tagsStore = 'tags'
    this.historyStore = 'history'
  }

  // 初始化数据库
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => {
        console.error('数据库打开失败:', request.error)
        reject(request.error)
      }
      
      request.onsuccess = () => {
        this.db = request.result
        console.log('数据库初始化成功')
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // 创建资产表
        if (!db.objectStoreNames.contains(this.assetsStore)) {
          const assetsStore = db.createObjectStore(this.assetsStore, { keyPath: 'id', autoIncrement: true })
          assetsStore.createIndex('tagId', 'tagId', { unique: false })
          assetsStore.createIndex('updateTime', 'updateTime', { unique: false })
        }
        
        // 创建标签表
        if (!db.objectStoreNames.contains(this.tagsStore)) {
          const tagsStore = db.createObjectStore(this.tagsStore, { keyPath: 'id', autoIncrement: true })
          tagsStore.createIndex('name', 'name', { unique: true })
        }
        
        // 创建历史记录表
        if (!db.objectStoreNames.contains(this.historyStore)) {
          const historyStore = db.createObjectStore(this.historyStore, { keyPath: 'id', autoIncrement: true })
          historyStore.createIndex('time', 'time', { unique: false })
          historyStore.createIndex('type', 'type', { unique: false })
        }
        
        // 初始化默认标签
        this.initDefaultTags(db)
      }
    })
  }

  // 初始化默认标签
  async initDefaultTags(db) {
    const defaultTags = [
      { name: '现金', color: '#34C759' },
      { name: '银行存款', color: '#007AFF' },
      { name: '股票基金', color: '#FF9500' },
      { name: '房产', color: '#AF52DE' },
      { name: '车辆', color: '#FF3B30' },
      { name: '其他', color: '#8E8E93' }
    ]
    
    const transaction = db.transaction([this.tagsStore], 'readwrite')
    const store = transaction.objectStore(this.tagsStore)
    
    // 检查是否已有标签，如果没有才添加默认标签
    const existingTags = await new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
    
    if (existingTags.length === 0) {
      for (const tag of defaultTags) {
        try {
          store.add(tag)
        } catch (error) {
          // 忽略重复添加的错误
          console.log('标签已存在，跳过:', tag.name)
        }
      }
    }
  }

  // 通用数据库操作方法
  async executeTransaction(storeName, mode, operation) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'))
        return
      }
      
      const transaction = this.db.transaction([storeName], mode)
      const store = transaction.objectStore(storeName)
      
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      
      operation(store)
    })
  }

  // 资产相关方法
  async getAssets() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        console.log('数据库未初始化，返回空数组')
        resolve([])
        return
      }
      
      console.log('从数据库获取资产数据...')
      const transaction = this.db.transaction([this.assetsStore], 'readonly')
      const store = transaction.objectStore(this.assetsStore)
      const request = store.getAll()
      
      request.onsuccess = () => {
        const result = request.result || []
        console.log('数据库返回资产数据:', result)
        resolve(result)
      }
      request.onerror = () => {
        console.error('获取资产数据失败:', request.error)
        reject(request.error)
      }
    })
  }

  async addAsset(asset) {
    // 只有在时间戳不存在时才设置新时间戳，保留导入数据的原始时间
    if (!asset.createTime) {
      asset.createTime = new Date().toISOString()
    }
    if (!asset.updateTime) {
      asset.updateTime = new Date().toISOString()
    }
    
    try {
      await this.executeTransaction(this.assetsStore, 'readwrite', (store) => {
        store.add(asset)
      })
      
      // 添加历史记录
      await this.addHistory({
        type: 'add',
        assetId: asset.id,
        amount: asset.amount,
        description: `添加${asset.name}`,
        time: new Date().toISOString()
      })
      
      return true
    } catch (error) {
      console.error('添加资产失败:', error)
      return false
    }
  }

  // 专门用于导入数据的方法，保留原始时间戳，不添加历史记录
  async importAsset(asset) {
    try {
      await this.executeTransaction(this.assetsStore, 'readwrite', (store) => {
        store.add(asset)
      })
      return true
    } catch (error) {
      console.error('导入资产失败:', error)
      return false
    }
  }

  async updateAsset(asset) {
    try {
      const assets = await this.getAssets()
      const oldAsset = assets.find(a => a.id === asset.id)
      
      asset.updateTime = new Date().toISOString()
      
      await this.executeTransaction(this.assetsStore, 'readwrite', (store) => {
        store.put(asset)
      })
      
      // 添加历史记录
      if (oldAsset && oldAsset.amount !== asset.amount) {
        await this.addHistory({
          type: 'update',
          assetId: asset.id,
          oldAmount: oldAsset.amount,
          newAmount: asset.amount,
          description: `更新${asset.name}`,
          time: new Date().toISOString()
        })
      }
      
      return true
    } catch (error) {
      console.error('更新资产失败:', error)
      return false
    }
  }

  async deleteAsset(assetId) {
    try {
      const assets = await this.getAssets()
      const asset = assets.find(a => a.id === assetId)
      
      await this.executeTransaction(this.assetsStore, 'readwrite', (store) => {
        store.delete(assetId)
      })
      
      // 添加历史记录
      if (asset) {
        await this.addHistory({
          type: 'delete',
          assetId,
          amount: asset.amount,
          description: `删除${asset.name}`,
          time: new Date().toISOString()
        })
      }
      
      return true
    } catch (error) {
      console.error('删除资产失败:', error)
      return false
    }
  }

  // 标签相关方法
  async getTags() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([])
        return
      }
      
      const transaction = this.db.transaction([this.tagsStore], 'readonly')
      const store = transaction.objectStore(this.tagsStore)
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async addTag(tag) {
    try {
      await this.executeTransaction(this.tagsStore, 'readwrite', (store) => {
        store.add(tag)
      })
      return true
    } catch (error) {
      console.error('添加标签失败:', error)
      return false
    }
  }

  // 专门用于导入标签的方法
  async importTag(tag) {
    try {
      await this.executeTransaction(this.tagsStore, 'readwrite', (store) => {
        store.add(tag)
      })
      return true
    } catch (error) {
      console.error('导入标签失败:', error)
      return false
    }
  }

  async updateTag(tag) {
    try {
      await this.executeTransaction(this.tagsStore, 'readwrite', (store) => {
        store.put(tag)
      })
      return true
    } catch (error) {
      console.error('更新标签失败:', error)
      return false
    }
  }

  async deleteTag(tagId) {
    try {
      await this.executeTransaction(this.tagsStore, 'readwrite', (store) => {
        store.delete(tagId)
      })
      return true
    } catch (error) {
      console.error('删除标签失败:', error)
      return false
    }
  }

  // 历史记录相关方法
  async getHistory() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([])
        return
      }
      
      const transaction = this.db.transaction([this.historyStore], 'readonly')
      const store = transaction.objectStore(this.historyStore)
      const request = store.getAll()
      
      request.onsuccess = () => {
        const history = request.result || []
        // 按时间倒序排列
        history.sort((a, b) => new Date(b.time) - new Date(a.time))
        resolve(history)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async addHistory(record) {
    try {
      await this.executeTransaction(this.historyStore, 'readwrite', (store) => {
        store.add(record)
      })
      return true
    } catch (error) {
      console.error('添加历史记录失败:', error)
      return false
    }
  }

  // 专门用于导入历史记录的方法
  async importHistory(record) {
    try {
      await this.executeTransaction(this.historyStore, 'readwrite', (store) => {
        store.add(record)
      })
      return true
    } catch (error) {
      console.error('导入历史记录失败:', error)
      return false
    }
  }

  // 统计方法
  async getTotalAssets() {
    const assets = await this.getAssets()
    return assets.reduce((total, asset) => total + (asset.amount || 0), 0)
  }

  async getAssetsByTag(tagId) {
    const assets = await this.getAssets()
    return assets.filter(asset => asset.tagId === tagId)
  }

  // 导出数据
  async exportData() {
    try {
      // 由于浏览器环境限制，我们仍然导出JSON格式
      // 在实际应用中，这里应该调用后端API来导出SQLite文件
      const assets = await this.getAssets()
      const tags = await this.getTags()
      const history = await this.getHistory()
      
      const data = {
        assets,
        tags,
        history,
        exportTime: new Date().toISOString()
      }
      
      // 创建下载链接
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `家庭资产数据库_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('导出数据失败:', error)
      return false
    }
  }

  // 导入数据
  async importData(file) {
    try {
      // 由于浏览器环境限制，我们仍然导入JSON格式
      // 在实际应用中，这里应该调用后端API来导入SQLite文件
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const data = JSON.parse(e.target.result)
            
            // 清空现有数据
            await this.clearAllData()
            
            // 导入标签 - 保留原始数据
            if (data.tags && Array.isArray(data.tags)) {
              for (const tag of data.tags) {
                await this.importTag(tag)
              }
            }
            
            // 导入资产 - 保留原始时间戳，不触发历史记录
            if (data.assets && Array.isArray(data.assets)) {
              for (const asset of data.assets) {
                await this.importAsset(asset)
              }
            }
            
            // 导入历史记录 - 保留原始数据
            if (data.history && Array.isArray(data.history)) {
              for (const record of data.history) {
                await this.importHistory(record)
              }
            }
            
            resolve(true)
          } catch (error) {
            reject(error)
          }
        }
        reader.readAsText(file)
      })
    } catch (error) {
      console.error('导入数据失败:', error)
      return false
    }
  }

  // 清空所有数据
  async clearAllData() {
    try {
      await this.executeTransaction(this.assetsStore, 'readwrite', (store) => {
        store.clear()
      })
      await this.executeTransaction(this.tagsStore, 'readwrite', (store) => {
        store.clear()
      })
      await this.executeTransaction(this.historyStore, 'readwrite', (store) => {
        store.clear()
      })
      return true
    } catch (error) {
      console.error('清空数据失败:', error)
      return false
    }
  }
}

// 创建数据库实例
const db = new Database()

// 初始化数据库
export async function initDatabase() {
  try {
    console.log('开始初始化数据库...')
    await db.init()
    console.log('数据库初始化完成')
  } catch (error) {
    console.error('数据库初始化失败:', error)
    // 如果IndexedDB不可用，回退到localStorage
    console.log('回退到localStorage存储')
  }
}

// 导出数据库实例
export default db 