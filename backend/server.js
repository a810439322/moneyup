const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')


const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// 数据库连接
const dbPath = path.join(dataDir, 'moneyup.db')
const db = new sqlite3.Database(dbPath)

// 初始化数据库表
db.serialize(() => {
  // 创建资产表
  db.run(`CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    tagId INTEGER,
    description TEXT,
    createTime TEXT NOT NULL,
    updateTime TEXT NOT NULL,
    FOREIGN KEY(tagId) REFERENCES tags(id)
  )`)

  // 创建标签表
  db.run(`CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL
  )`)

  // 创建历史记录表
  db.run(`CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    assetId INTEGER,
    amount REAL,
    oldAmount REAL,
    newAmount REAL,
    description TEXT,
    time TEXT NOT NULL
  )`)

  // 插入默认标签（如果不存在）
  const defaultTags = [
    { name: '现金', color: '#34C759' },
    { name: '银行存款', color: '#007AFF' },
    { name: '股票基金', color: '#FF9500' },
    { name: '房产', color: '#AF52DE' },
    { name: '车辆', color: '#FF3B30' },
    { name: '其他', color: '#8E8E93' }
  ]

  defaultTags.forEach(tag => {
    db.run('INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?)', [tag.name, tag.color])
  })
})

// API 路由

// 获取所有资产
app.get('/api/assets', (req, res) => {
  db.all('SELECT * FROM assets ORDER BY updateTime DESC', (err, rows) => {
    if (err) {
      console.error('获取资产失败:', err)
      res.status(500).json({ error: '获取资产失败' })
    } else {
      res.json(rows)
    }
  })
})

// 添加资产
app.post('/api/assets', (req, res) => {
  const { name, amount, tagId, description } = req.body
  const createTime = new Date().toISOString()
  const updateTime = createTime

  db.run(
    'INSERT INTO assets (name, amount, tagId, description, createTime, updateTime) VALUES (?, ?, ?, ?, ?, ?)',
    [name, amount, tagId, description, createTime, updateTime],
    function(err) {
      if (err) {
        console.error('添加资产失败:', err)
        res.status(500).json({ error: '添加资产失败' })
      } else {
        // 添加历史记录
        db.run(
          'INSERT INTO history (type, assetId, amount, description, time) VALUES (?, ?, ?, ?, ?)',
          ['add', this.lastID, amount, `添加${name}`, createTime]
        )
        res.json({ id: this.lastID, name, amount, tagId, description, createTime, updateTime })
      }
    }
  )
})

// 更新资产
app.put('/api/assets/:id', (req, res) => {
  const { id } = req.params
  const { name, amount, tagId, description } = req.body
  const updateTime = new Date().toISOString()

  // 先获取旧数据
  db.get('SELECT * FROM assets WHERE id = ?', [id], (err, oldAsset) => {
    if (err) {
      console.error('获取资产失败:', err)
      res.status(500).json({ error: '获取资产失败' })
      return
    }

    // 更新资产
    db.run(
      'UPDATE assets SET name = ?, amount = ?, tagId = ?, description = ?, updateTime = ? WHERE id = ?',
      [name, amount, tagId, description, updateTime, id],
      function(err) {
        if (err) {
          console.error('更新资产失败:', err)
          res.status(500).json({ error: '更新资产失败' })
        } else {
          // 如果金额发生变化，添加历史记录
          if (oldAsset && oldAsset.amount !== amount) {
            db.run(
              'INSERT INTO history (type, assetId, oldAmount, newAmount, description, time) VALUES (?, ?, ?, ?, ?, ?)',
              ['update', id, oldAsset.amount, amount, `更新${name}`, updateTime]
            )
          }
          res.json({ id: parseInt(id), name, amount, tagId, description, updateTime })
        }
      }
    )
  })
})

// 删除资产
app.delete('/api/assets/:id', (req, res) => {
  const { id } = req.params

  // 先获取要删除的资产信息
  db.get('SELECT * FROM assets WHERE id = ?', [id], (err, asset) => {
    if (err) {
      console.error('获取资产失败:', err)
      res.status(500).json({ error: '获取资产失败' })
      return
    }

    if (!asset) {
      res.status(404).json({ error: '资产不存在' })
      return
    }

    // 删除资产
    db.run('DELETE FROM assets WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('删除资产失败:', err)
        res.status(500).json({ error: '删除资产失败' })
      } else {
        // 添加历史记录
        db.run(
          'INSERT INTO history (type, assetId, amount, description, time) VALUES (?, ?, ?, ?, ?)',
          ['delete', id, asset.amount, `删除${asset.name}`, new Date().toISOString()]
        )
        res.json({ message: '删除成功' })
      }
    })
  })
})

// 获取所有标签
app.get('/api/tags', (req, res) => {
  db.all('SELECT * FROM tags ORDER BY id', (err, rows) => {
    if (err) {
      console.error('获取标签失败:', err)
      res.status(500).json({ error: '获取标签失败' })
    } else {
      res.json(rows)
    }
  })
})

// 添加标签
app.post('/api/tags', (req, res) => {
  const { name, color } = req.body

  db.run('INSERT INTO tags (name, color) VALUES (?, ?)', [name, color], function(err) {
    if (err) {
      console.error('添加标签失败:', err)
      res.status(500).json({ error: '添加标签失败' })
    } else {
      res.json({ id: this.lastID, name, color })
    }
  })
})

// 更新标签
app.put('/api/tags/:id', (req, res) => {
  const { id } = req.params
  const { name, color } = req.body

  db.run('UPDATE tags SET name = ?, color = ? WHERE id = ?', [name, color, id], function(err) {
    if (err) {
      console.error('更新标签失败:', err)
      res.status(500).json({ error: '更新标签失败' })
    } else {
      res.json({ id: parseInt(id), name, color })
    }
  })
})

// 删除标签
app.delete('/api/tags/:id', (req, res) => {
  const { id } = req.params

  db.run('DELETE FROM tags WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('删除标签失败:', err)
      res.status(500).json({ error: '删除标签失败' })
    } else {
      res.json({ message: '删除成功' })
    }
  })
})

// 获取历史记录
app.get('/api/history', (req, res) => {
  db.all('SELECT * FROM history ORDER BY time DESC', (err, rows) => {
    if (err) {
      console.error('获取历史记录失败:', err)
      res.status(500).json({ error: '获取历史记录失败' })
    } else {
      res.json(rows)
    }
  })
})

// 获取统计数据
app.get('/api/statistics', (req, res) => {
  db.get('SELECT SUM(amount) as total FROM assets', (err, result) => {
    if (err) {
      console.error('获取统计数据失败:', err)
      res.status(500).json({ error: '获取统计数据失败' })
    } else {
      res.json({ totalAssets: result.total || 0 })
    }
  })
})

// 按标签获取资产
app.get('/api/assets/by-tag/:tagId', (req, res) => {
  const { tagId } = req.params
  db.all('SELECT * FROM assets WHERE tagId = ?', [tagId], (err, rows) => {
    if (err) {
      console.error('获取资产失败:', err)
      res.status(500).json({ error: '获取资产失败' })
    } else {
      res.json(rows)
    }
  })
})



// 清空所有数据
app.delete('/api/clear', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM history')
    db.run('DELETE FROM assets')
    db.run('DELETE FROM tags')
    
    // 重置自增ID
    db.run('DELETE FROM sqlite_sequence WHERE name IN ("assets", "tags", "history")')
    
    // 重新插入默认标签
    const defaultTags = [
      { name: '现金', color: '#34C759' },
      { name: '银行存款', color: '#007AFF' },
      { name: '股票基金', color: '#FF9500' },
      { name: '房产', color: '#AF52DE' },
      { name: '车辆', color: '#FF3B30' },
      { name: '其他', color: '#8E8E93' }
    ]

    defaultTags.forEach(tag => {
      db.run('INSERT INTO tags (name, color) VALUES (?, ?)', [tag.name, tag.color])
    })
  })
  
  res.json({ message: '清空成功' })
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在端口 ${PORT}`)
  console.log(`数据库文件位置: ${dbPath}`)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('正在关闭服务器...')
  db.close((err) => {
    if (err) {
      console.error('关闭数据库失败:', err)
    } else {
      console.log('数据库连接已关闭')
    }
    process.exit(0)
  })
}) 