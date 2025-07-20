<template>
  <div class="page">
    <!-- 顶部统计 -->
    <div class="header">
      <div class="header-actions">
        <button class="btn-icon" @click="refreshData" title="刷新">
          <span>🔄</span>
        </button>
        <button class="btn-icon" @click="showAddModal" title="添加资产">
          <span>➕</span>
        </button>
        <button class="btn-icon" @click="showHistoryModal" title="查看历史">
          <span>📋</span>
        </button>
        <button class="btn-icon" @click="showSettingsModal" title="设置">
          <span>⚙️</span>
        </button>
      </div>
    </div>

    <!-- 标签筛选 -->
    <div class="filter-section">
      <div class="filter-tabs">
        <button 
          class="filter-tab" 
          :class="{ active: selectedTagId === null }"
          @click="selectTag(null)"
        >
          全部
          <span class="filter-amount">¥{{ formatNumber(totalAssets) }}</span>
        </button>
        <button 
          v-for="tag in tags" 
          :key="tag.id"
          class="filter-tab" 
          :class="{ active: selectedTagId === tag.id }"
          @click="selectTag(tag.id)"
        >
          {{ tag.name }}
          <span class="filter-amount">¥{{ formatNumber(getTagTotal(tag.id)) }}</span>
        </button>
      </div>
    </div>

    <!-- 资产列表 -->
    <div class="assets-list">
      <div class="list-header">
        <div class="header-name">资产名称</div>
        <div class="header-type">类型</div>
        <div class="header-amount">金额</div>
        <div class="header-time">更新时间</div>
        <div class="header-actions">操作</div>
      </div>
      
      <div 
        v-for="asset in filteredAssets" 
        :key="asset.id"
        class="asset-item"
      >
        <div class="asset-name">{{ asset.name }}</div>
        <div class="asset-type">
          <span class="asset-tag" :style="{ backgroundColor: getTagColor(asset.tagId) }">
            {{ getTagName(asset.tagId) }}
          </span>
        </div>
        <div class="asset-amount">¥{{ formatNumber(asset.amount) }}</div>
        <div class="asset-time">{{ formatTime(asset.updateTime) }}</div>
        <div class="asset-actions">
          <button class="btn-edit" @click="editAsset(asset)" title="编辑">
            ✏️
          </button>
        </div>
      </div>
      
      <div v-if="filteredAssets.length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <div class="empty-text">暂无资产数据</div>
        <button class="btn-primary" @click="showAddModal">添加第一个资产</button>
      </div>
    </div>

    <!-- 统计图表区域 -->
    <div class="statistics-section">
      <div class="section-header">
        <div class="section-title">数据统计</div>
      </div>
      
      <!-- 总资产显示 -->
      <div class="total-assets-card" @click="triggerFireworks" title="点击查看彩蛋 🎆">
        <div class="total-label">总资产</div>
        <div class="total-amount">¥{{ formatNumber(totalAssets) }}</div>
      </div>
      
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-label">资产项目</div>
            <div class="stat-value">{{ assets.length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏷️</div>
          <div class="stat-content">
            <div class="stat-label">资产类型</div>
            <div class="stat-value">{{ tags.length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <div class="stat-label">本月变化</div>
            <div class="stat-value" :class="{ 'positive': monthlyChange >= 0, 'negative': monthlyChange < 0 }">
              {{ monthlyChange >= 0 ? '+' : '' }}¥{{ formatNumber(monthlyChange) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-container">
        <!-- 资产分布图 -->
        <div class="chart-card full-width">
          <div class="chart-header">
            <div class="chart-title">资产分布</div>
            <div class="chart-controls">
              <div class="pie-size-control">
                <label>饼图大小:</label>
                <input 
                  type="range" 
                  v-model="pieChartSize" 
                  min="50" 
                  max="90" 
                  step="5"
                  @input="updatePieChart"
                />
                <span class="size-value">{{ pieChartSize }}%</span>
              </div>
            </div>
          </div>
          <div class="chart-content">
            <v-chart class="chart" :option="pieChartOption" />
          </div>
        </div>
      </div>

      <!-- 趋势图控制区域 -->
      <div class="trend-controls">
        <div class="trend-header">
          <div class="trend-title">变化趋势</div>
          <div class="trend-controls-group">
            <div class="trend-period-selector">
              <label>时间范围:</label>
              <select v-model="trendPeriod" @change="updateTrendPeriod">
                <option value="all">全部</option>
                <option value="7">最近7天</option>
                <option value="30">最近30天</option>
                <option value="90">最近90天</option>
                <option value="365">最近一年</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            
            <!-- 日期选择器 - 始终显示 -->
            <div class="date-picker">
              <div class="date-input-group">
                <label>开始日期:</label>
                <input 
                  type="date" 
                  v-model="customStartDate" 
                  @change="updateTrendChart"
                  :max="customEndDate || today"
                />
              </div>
              <div class="date-input-group">
                <label>结束日期:</label>
                <input 
                  type="date" 
                  v-model="customEndDate" 
                  @change="updateTrendChart"
                  :min="customStartDate"
                  :max="today"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 变化趋势图 -->
      <div class="trend-chart-container">
        <div class="chart-card">
          <div class="chart-content">
            <v-chart class="chart" :option="lineChartOption" />
          </div>
        </div>
      </div>
    </div>

    <!-- 添加资产弹窗 -->
    <div v-if="showAdd" class="modal-overlay" @click="closeAddModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>添加资产</h3>
          <button class="btn-close" @click="closeAddModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>资产名称</label>
            <input v-model="newAsset.name" type="text" placeholder="请输入资产名称" />
          </div>
          <div class="form-group">
            <label>资产金额</label>
            <input v-model="newAsset.amount" type="number" placeholder="请输入金额" />
          </div>
          <div class="form-group">
            <label>资产类型</label>
            <select v-model="newAsset.tagId">
              <option value="">请选择类型</option>
              <option v-for="tag in tags" :key="tag.id" :value="tag.id">
                {{ tag.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea v-model="newAsset.remark" placeholder="请输入备注信息"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeAddModal">取消</button>
          <button class="btn-primary" @click="addAsset">确定</button>
        </div>
      </div>
    </div>

    <!-- 编辑资产弹窗 -->
    <div v-if="showEdit" class="modal-overlay" @click="closeEditModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>编辑资产</h3>
          <button class="btn-close" @click="closeEditModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>资产名称</label>
            <input v-model="editingAsset.name" type="text" placeholder="请输入资产名称" />
          </div>
          <div class="form-group">
            <label>资产金额</label>
            <input v-model="editingAsset.amount" type="number" placeholder="请输入金额" />
          </div>
          <div class="form-group">
            <label>资产类型</label>
            <select v-model="editingAsset.tagId">
              <option value="">请选择类型</option>
              <option v-for="tag in tags" :key="tag.id" :value="tag.id">
                {{ tag.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea v-model="editingAsset.remark" placeholder="请输入备注信息"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-delete" @click="deleteAsset" title="删除">🗑️ 删除</button>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeEditModal">取消</button>
            <button class="btn-primary" @click="updateAsset">保存</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录弹窗 -->
    <div v-if="showHistory" class="modal-overlay" @click="closeHistoryModal">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h3>更新历史</h3>
          <button class="btn-close" @click="closeHistoryModal">×</button>
        </div>
        <div class="modal-body">
          <div class="history-list">
            <div v-for="record in history" :key="record.id" class="history-item">
              <div class="history-icon">{{ getHistoryIcon(record.type) }}</div>
              <div class="history-content">
                <div class="history-desc">{{ record.description }}</div>
                <div class="history-time">{{ formatTime(record.time) }}</div>
              </div>
              <div class="history-amount" :class="{ 'positive': record.amount > 0, 'negative': record.amount < 0 }">
                {{ record.amount > 0 ? '+' : '' }}¥{{ formatNumber(Math.abs(record.amount || 0)) }}
              </div>
            </div>
            <div v-if="history.length === 0" class="empty-history">
              暂无历史记录
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <div v-if="showSettings" class="modal-overlay" @click="closeSettingsModal">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h3>系统设置</h3>
          <button class="btn-close" @click="closeSettingsModal">×</button>
        </div>
        <div class="modal-body">
          <!-- 标签管理 -->
          <div class="settings-section">
            <div class="section-header">
              <h4>标签管理</h4>
              <button class="btn-primary btn-small" @click="showAddTagModal">添加标签</button>
            </div>
            
            <div class="tags-list">
              <div v-for="tag in tags" :key="tag.id" class="tag-item">
                <div class="tag-info">
                  <div class="tag-color" :style="{ backgroundColor: tag.color }"></div>
                  <div class="tag-name">{{ tag.name }}</div>
                </div>
                <div class="tag-actions">
                  <button class="btn-small" @click="editTag(tag)">编辑</button>
                  <button class="btn-small btn-delete" @click="deleteTag(tag)" :disabled="isTagInUse(tag.id)">删除</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 数据管理 -->
          <div class="settings-section">
            <div class="section-header">
              <h4>数据管理</h4>
            </div>
            
            <div class="data-actions">
              <div class="action-item">
                <div class="action-info">
                  <div class="action-icon">💾</div>
                  <div class="action-content">
                    <div class="action-title">数据备份</div>
                    <div class="action-desc">直接复制 data/moneyup.db 文件进行备份</div>
                  </div>
                </div>
                <button class="btn-secondary" disabled>文件备份</button>
              </div>
              
              <div class="action-item">
                <div class="action-info">
                  <div class="action-icon">🔄</div>
                  <div class="action-content">
                    <div class="action-title">数据恢复</div>
                    <div class="action-desc">替换 data/moneyup.db 文件并重启服务</div>
                  </div>
                </div>
                <button class="btn-secondary" disabled>文件恢复</button>
              </div>
            </div>
          </div>

          <!-- 应用信息 -->
          <div class="settings-section">
            <div class="section-header">
              <h4>应用信息</h4>
            </div>
            
            <div class="info-list">
              <div class="info-item">
                <div class="info-label">应用名称</div>
                <div class="info-value">家庭资产记录管理系统</div>
              </div>
              <div class="info-item">
                <div class="info-label">版本</div>
                <div class="info-value">1.0.0</div>
              </div>
              <div class="info-item">
                <div class="info-label">数据存储</div>
                <div class="info-value">SQLite 数据库</div>
              </div>
              <div class="info-item">
                <div class="info-label">总资产数</div>
                <div class="info-value">{{ assets.length }} 项</div>
              </div>
              <div class="info-item">
                <div class="info-label">标签数量</div>
                <div class="info-value">{{ tags.length }} 个</div>
              </div>
              <div class="info-item">
                <div class="info-label">记录数量</div>
                <div class="info-value">{{ history.length }} 条</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑标签弹窗 -->
    <div v-if="showTagModal" class="modal-overlay" @click="closeTagModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingTag ? '编辑标签' : '添加标签' }}</h3>
          <button class="btn-close" @click="closeTagModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>标签名称</label>
            <input v-model="newTag.name" type="text" placeholder="请输入标签名称" />
          </div>
          <div class="form-group">
            <label>标签颜色</label>
            <div class="color-picker">
              <div 
                v-for="color in colorOptions" 
                :key="color"
                class="color-option"
                :class="{ active: newTag.color === color }"
                :style="{ backgroundColor: color }"
                @click="newTag.color = color"
              ></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeTagModal">取消</button>
          <button class="btn-primary" @click="saveTag">确定</button>
        </div>
      </div>
    </div>

    <!-- Toast提示 -->
    <div v-if="showToast" class="toast" :class="toastType">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script>
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import db from '../../utils/api-database.js'
import confetti from 'canvas-confetti'

use([
  CanvasRenderer,
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

export default {
  name: 'IndexPage',
  components: {
    VChart
  },
  data() {
    return {

      assets: [],
      tags: [],
      history: [],
      selectedTagId: null,
      showAdd: false,
      showEdit: false,
      showHistory: false,
      showSettings: false,
      showTagModal: false,
      showToast: false,
      toastMessage: '',
      toastType: 'info',
      trendPeriod: 'all',
      customStartDate: '',
      customEndDate: '',
      newAsset: {
        name: '',
        amount: '',
        tagId: '',
        remark: ''
      },
      editingAsset: {
        id: null,
        name: '',
        amount: '',
        tagId: '',
        remark: ''
      },
      newTag: {
        name: '',
        color: '#007AFF'
      },
      editingTag: null,
      colorOptions: [
        '#007AFF', '#34C759', '#FF9500', '#FF3B30', 
        '#AF52DE', '#5856D6', '#FF2D92', '#5AC8FA',
        '#FFCC02', '#4CD964', '#FF9500', '#FF3B30'
      ],
      pieChartSize: 90
    }
  },
  computed: {
    today() {
      return new Date().toISOString().split('T')[0]
    },
    totalAssets() {
      return this.assets.reduce((total, asset) => total + (asset.amount || 0), 0)
    },
    filteredAssets() {
      if (this.selectedTagId === null) {
        return this.assets
      }
      return this.assets.filter(asset => asset.tagId === this.selectedTagId)
    },
    monthlyChange() {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      
      const currentMonthAssets = this.assets.filter(asset => 
        new Date(asset.updateTime) >= monthStart
      )
      const lastMonthAssets = this.assets.filter(asset => 
        new Date(asset.updateTime) >= lastMonthStart && new Date(asset.updateTime) < monthStart
      )
      
      const currentTotal = currentMonthAssets.reduce((sum, asset) => sum + (asset.amount || 0), 0)
      const lastTotal = lastMonthAssets.reduce((sum, asset) => sum + (asset.amount || 0), 0)
      
      return currentTotal - lastTotal
    },
    pieChartOption() {
      const data = this.distributionData.map(item => ({
        name: item.name,
        value: item.amount,
        itemStyle: { color: item.color }
      }))
      
      return {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          textStyle: { fontSize: 12 }
        },
        series: [
          {
            name: '资产分布',
            type: 'pie',
            radius: `${this.pieChartSize}%`,
            data: data,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
    },
    lineChartOption() {
      const trendData = this.generateTrendData()
      
      if (!trendData.total || trendData.total.length === 0) {
        return {
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: [] },
          yAxis: { type: 'value' },
          series: []
        }
      }
      
      const series = [
        {
          name: '总资产',
          type: 'line',
          data: trendData.total.map(d => d.value),
          smooth: true,
          lineStyle: { color: '#007AFF', width: 3 },
          itemStyle: { color: '#007AFF' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 122, 255, 0.3)' },
                { offset: 1, color: 'rgba(0, 122, 255, 0.1)' }
              ]
            }
          }
        }
      ]
      
      // 添加每个标签的趋势线
      Object.values(trendData.tags).forEach(tag => {
        if (tag.data.length > 0) {
          series.push({
            name: tag.name,
            type: 'line',
            data: tag.data.map(d => d.value),
            smooth: true,
            lineStyle: { color: tag.color, width: 2 },
            itemStyle: { color: tag.color }
          })
        }
      })
      
      return {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            let result = params[0].name + '<br/>'
            params.forEach(param => {
              result += param.marker + param.seriesName + ': ¥' + param.value.toLocaleString() + '<br/>'
            })
            return result
          }
        },
        legend: {
          data: series.map(s => s.name),
          bottom: 0,
          textStyle: { fontSize: 12 }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: trendData.total.map(d => d.date),
          axisLabel: { fontSize: 12 }
        },
        yAxis: {
          type: 'value',
          axisLabel: { 
            formatter: '¥{value}',
            fontSize: 12
          }
        },
        series: series
      }
    },
    distributionData() {
      const distribution = {}
      
      this.assets.forEach(asset => {
        const tag = this.tags.find(t => t.id === asset.tagId)
        if (tag) {
          if (!distribution[asset.tagId]) {
            distribution[asset.tagId] = {
              tagId: asset.tagId,
              name: tag.name,
              color: tag.color,
              amount: 0
            }
          }
          distribution[asset.tagId].amount += asset.amount || 0
        }
      })
      
      return Object.values(distribution).sort((a, b) => b.amount - a.amount)
    }
  },
  async mounted() {
    await this.loadData()
    // 初始化趋势图日期
    this.updateTrendPeriod()
  },
  methods: {
    async loadData() {
      try {
        console.log('开始加载数据...')
        this.assets = await db.getAssets()
        console.log('资产数据:', this.assets)
        this.tags = await db.getTags()
        console.log('标签数据:', this.tags)
        this.history = await db.getHistory()
        console.log('历史数据:', this.history)
        console.log('数据加载完成')
      } catch (error) {
        console.error('加载数据失败:', error)
        this.showToastMessage('加载数据失败', 'error')
      }
    },
    async refreshData() {
      await this.loadData()
      this.showToastMessage('数据已刷新', 'success')
    },
    selectTag(tagId) {
      this.selectedTagId = tagId
    },
    getTagName(tagId) {
      const tag = this.tags.find(t => t.id === tagId)
      return tag ? tag.name : '未知'
    },
    getTagColor(tagId) {
      const tag = this.tags.find(t => t.id === tagId)
      return tag ? tag.color : '#8E8E93'
    },
    getTagTotal(tagId) {
      return this.assets
        .filter(asset => asset.tagId === tagId)
        .reduce((total, asset) => total + (asset.amount || 0), 0)
    },
    formatNumber(num) {
      return Number(num).toLocaleString('zh-CN')
    },
    formatTime(timeStr) {
      const date = new Date(timeStr)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
      if (diff < 2592000000) return `${Math.floor(diff / 86400000)}天前`
      
      return date.toLocaleDateString('zh-CN')
    },
    getHistoryIcon(type) {
      const icons = {
        add: '➕',
        update: '✏️',
        delete: '🗑️'
      }
      return icons[type] || '📝'
    },
    generateTrendData() {
      let startDate, endDate
      
      if (this.trendPeriod === 'custom') {
        if (!this.customStartDate || !this.customEndDate) {
          return { total: [], tags: {} }
        }
        startDate = new Date(this.customStartDate)
        endDate = new Date(this.customEndDate)
      } else if (this.trendPeriod === 'all') {
        endDate = new Date()
        startDate = new Date()
        startDate.setFullYear(endDate.getFullYear() - 1)
      } else {
        const days = parseInt(this.trendPeriod)
        endDate = new Date()
        startDate = new Date()
        startDate.setDate(endDate.getDate() - days + 1)
      }
      
      const data = []
      const tagData = {}
      
      // 初始化每个标签的数据
      this.tags.forEach(tag => {
        tagData[tag.id] = {
          name: tag.name,
          color: tag.color,
          data: []
        }
      })
      
      // 生成日期序列
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dateStr = currentDate.toLocaleDateString('zh-CN')
        
        // 使用当前总资产数据，不添加随机变化
        const totalValue = this.totalAssets
        
        data.push({
          date: dateStr,
          value: totalValue
        })
        
        // 为每个标签生成数据
        this.tags.forEach(tag => {
          const tagAssets = this.assets.filter(asset => asset.tagId === tag.id)
          const tagValue = tagAssets.reduce((sum, asset) => sum + (asset.amount || 0), 0)
          
          tagData[tag.id].data.push({
            date: dateStr,
            value: tagValue
          })
        })
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      return { total: data, tags: tagData }
    },
    updateTrendPeriod() {
      const today = new Date()
      let startDate = new Date()
      
      if (this.trendPeriod === 'custom') {
        // 自定义模式，保持当前日期设置
        return
      }
      
      if (this.trendPeriod === 'all') {
        // 全部模式，设置为一年前的日期到今天
        startDate.setFullYear(today.getFullYear() - 1)
        this.customStartDate = startDate.toISOString().split('T')[0]
        this.customEndDate = today.toISOString().split('T')[0]
        return
      }
      
      const days = parseInt(this.trendPeriod)
      startDate.setDate(today.getDate() - days + 1)
      
      // 设置日期格式为 YYYY-MM-DD
      this.customStartDate = startDate.toISOString().split('T')[0]
      this.customEndDate = today.toISOString().split('T')[0]
      
      // 图表会自动更新，因为使用了计算属性
    },
    updateTrendChart() {
      // 当用户手动修改日期时，自动切换到自定义模式
      if (this.trendPeriod !== 'custom') {
        this.trendPeriod = 'custom'
      }
      // 图表会自动更新，因为使用了计算属性
    },
    showAddModal() {
      this.showAdd = true
      this.newAsset = {
        name: '',
        amount: '',
        tagId: '',
        remark: ''
      }
    },
    closeAddModal() {
      this.showAdd = false
    },
    async addAsset() {
      if (!this.newAsset.name || !this.newAsset.amount || !this.newAsset.tagId) {
        this.showToastMessage('请填写完整信息', 'error')
        return
      }
      
      const asset = {
        name: this.newAsset.name,
        amount: Number(this.newAsset.amount),
        tagId: this.newAsset.tagId,
        remark: this.newAsset.remark
      }
      
      if (await db.addAsset(asset)) {
        await this.loadData()
        this.closeAddModal()
        this.showToastMessage('添加成功', 'success')
      } else {
        this.showToastMessage('添加失败', 'error')
      }
    },
    editAsset(asset) {
      this.editingAsset = { ...asset }
      this.showEdit = true
    },
    closeEditModal() {
      this.showEdit = false
      this.editingAsset = {
        id: null,
        name: '',
        amount: '',
        tagId: '',
        remark: ''
      }
    },
    async updateAsset() {
      if (!this.editingAsset.name || !this.editingAsset.amount || !this.editingAsset.tagId) {
        this.showToastMessage('请填写完整信息', 'error')
        return
      }
      
      const updatedAsset = {
        ...this.editingAsset,
        amount: Number(this.editingAsset.amount)
      }
      
      if (await db.updateAsset(updatedAsset)) {
        await this.loadData()
        this.closeEditModal()
        this.showToastMessage('更新成功', 'success')
      } else {
        this.showToastMessage('更新失败', 'error')
      }
    },
    async deleteAsset() {
      if (confirm(`确定要删除资产"${this.editingAsset.name}"吗？`)) {
        if (await db.deleteAsset(this.editingAsset.id)) {
          await this.loadData()
          this.closeEditModal()
          this.showToastMessage('删除成功', 'success')
        } else {
          this.showToastMessage('删除失败', 'error')
        }
      }
    },
    showHistoryModal() {
      this.showHistory = true
    },
    closeHistoryModal() {
      this.showHistory = false
    },
    showToastMessage(message, type = 'info') {
      this.toastMessage = message
      this.toastType = type
      this.showToast = true
      
      setTimeout(() => {
        this.showToast = false
      }, 3000)
    },
    showSettingsModal() {
      this.showSettings = true
    },
    closeSettingsModal() {
      this.showSettings = false
    },
    showAddTagModal() {
      this.showTagModal = true
      this.newTag = {
        name: '',
        color: '#007AFF'
      }
    },
    closeTagModal() {
      this.showTagModal = false
    },
    async saveTag() {
      if (!this.newTag.name) {
        this.showToastMessage('请填写标签名称', 'error')
        return
      }
      
      const tag = {
        name: this.newTag.name,
        color: this.newTag.color
      }
      
      if (await db.addTag(tag)) {
        await this.loadData()
        this.closeTagModal()
        this.showToastMessage('标签添加成功', 'success')
      } else {
        this.showToastMessage('标签添加失败', 'error')
      }
    },
    editTag(tag) {
      this.editingTag = { ...tag }
      this.showTagModal = true
    },
    async deleteTag(tag) {
      if (confirm(`确定要删除标签"${tag.name}"吗？`)) {
        if (await db.deleteTag(tag.id)) {
          await this.loadData()
          this.closeTagModal()
          this.showToastMessage('标签删除成功', 'success')
        } else {
          this.showToastMessage('标签删除失败', 'error')
        }
      }
    },
    isTagInUse(tagId) {
      return this.assets.some(asset => asset.tagId === tagId)
    },

    updatePieChart() {
      // 实现饼图大小变化的逻辑
    },
    triggerFireworks() {
      // 使用专业的烟花库
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#FF9F43', '#00D2D3', '#54A0FF', '#5F27CD', '#FF6348'
      ]
      
      // 从底部发射到空中爆炸
      confetti({
        particleCount: 100,
        spread: 120, // 增加扩散角度，更分散
        origin: { y: 1 }, // 从屏幕底部发射
        colors: colors,
        shapes: ['circle'],
        gravity: 0.3, // 增加重力，让烟花消失更快
        scalar: 1.2,
        drift: 0,
        ticks: 120, // 减少持续时间，消失更快
        angle: 90, // 垂直向上
        startVelocity: 80 // 增加速度，让烟花飞得更高
      })
      
      // 第二个烟花
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 1 },
          colors: colors,
          shapes: ['star'],
          gravity: 0.4, // 更快消失
          scalar: 1.3,
          ticks: 100, // 更短时间
          angle: 90,
          startVelocity: 75 // 增加速度
        })
      }, 150)
      
      // 第三个烟花
      setTimeout(() => {
        confetti({
          particleCount: 90,
          spread: 110,
          origin: { y: 1 },
          colors: colors,
          shapes: ['circle'],
          gravity: 0.35,
          scalar: 1.1,
          ticks: 110,
          angle: 90,
          startVelocity: 78 // 增加速度
        })
      }, 300)
    }
  }
}
</script>

<style scoped>
.page {
  padding: 20px;
  background: #f8f8f8;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-icon {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #e0e0e0;
  transform: scale(1.05);
}

.filter-section {
  background: #fff;
  padding: 15px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
}

.filter-tab {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: #f0f0f0;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.filter-tab.active {
  background: #007AFF;
  color: #fff;
}

.filter-amount {
  font-size: 12px;
  opacity: 0.8;
}

.assets-list {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1.5fr 80px;
  gap: 20px;
  padding: 15px 20px;
  background: #f8f8f8;
  font-weight: bold;
  color: #333;
  font-size: 14px;
  border-bottom: 1px solid #e0e0e0;
}

.asset-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1.5fr 80px;
  gap: 20px;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.asset-item:hover {
  background: #f8f8f8;
}

.asset-item:last-child {
  border-bottom: none;
}

.asset-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
}

.asset-type {
  display: flex;
  align-items: center;
}

.asset-tag {
  padding: 4px 12px;
  border-radius: 12px;
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
}

.asset-amount {
  font-size: 16px;
  font-weight: bold;
  color: #007AFF;
  display: flex;
  align-items: center;
}

.asset-time {
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
}

.asset-actions {
  display: flex;
  align-items: center;
}

.btn-edit {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-edit:hover {
  background: #e0e0e0;
  transform: scale(1.1);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.empty-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}

/* 统计区域 */
.statistics-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.total-assets-card {
  text-align: center;
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.total-assets-card:hover {
  transform: scale(1.02);
}

.total-assets-card:active {
  transform: scale(0.98);
}

.total-assets-card .total-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 5px;
  font-weight: 500;
}

.total-assets-card .total-amount {
  font-size: 28px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 30px;
}

.stat-card {
  background: #f8f8f8;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  font-size: 24px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 10px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.positive {
  color: #34C759;
}

.negative {
  color: #FF3B30;
}

.charts-container {
  display: block;
  margin-bottom: 20px;
}

.chart-card {
  background: #f8f8f8;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
}

.chart-card.full-width {
  width: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.pie-size-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pie-size-control label {
  font-size: 14px;
  color: #333;
  font-weight: bold;
  white-space: nowrap;
}

.pie-size-control input {
  width: 120px;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
}

.size-value {
  font-size: 14px;
  color: #666;
  min-width: 40px;
  text-align: center;
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #333;
  transform: scale(1.1);
}

.chart-content {
  height: 300px;
}

.chart {
  height: 100%;
  width: 100%;
}

/* 弹窗样式 */
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
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 700px;
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
  font-size: 18px;
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: bold;
  font-size: 14px;
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

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-top: 1px solid #f0f0f0;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.btn-small {
  padding: 8px 12px;
  font-size: 14px;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
  margin-bottom: 8px;
}

.history-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 6px;
  font-size: 12px;
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-desc {
  font-size: 14px;
  color: #333;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-time {
  font-size: 12px;
  color: #666;
}

.history-amount {
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
}

.empty-history {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 14px;
}

/* Toast提示 */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  z-index: 2000;
  animation: slideIn 0.3s ease;
}

.toast.success {
  background: #34C759;
}

.toast.error {
  background: #FF3B30;
}

.toast.info {
  background: #007AFF;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.btn-primary {
  background: #007AFF;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
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
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-delete {
  background: #8E8E93;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: #6D6D70;
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.date-picker {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.date-picker .date-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 140px;
}

.date-picker .date-input-group label {
  font-size: 14px;
  color: #333;
  font-weight: bold;
}

.date-picker .date-input-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
}

.trend-controls {
  margin-top: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.trend-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.trend-controls-group {
  display: flex;
  align-items: flex-start;
  gap: 30px;
}

.trend-period-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 150px;
}

.trend-period-selector label {
  font-size: 14px;
  color: #333;
  font-weight: bold;
}

.trend-period-selector select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
}

.trend-chart-container {
  margin-top: 20px;
}

.settings-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.settings-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.settings-section .section-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.tags-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
}

.tag-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tag-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.tag-name {
  font-size: 14px;
  color: #333;
}

.tag-actions {
  display: flex;
  gap: 8px;
}

.data-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f8f8;
  border-radius: 8px;
}

.action-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.action-icon {
  font-size: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 8px;
}

.action-content {
  flex: 1;
}

.action-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 3px;
}

.action-desc {
  font-size: 12px;
  color: #666;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: bold;
}

@media (max-width: 768px) {
  .page {
    padding: 15px;
  }
  
  .header {
    padding: 15px;
  }
  
  .total-amount {
    font-size: 24px;
  }
  
  .list-header,
  .asset-item {
    grid-template-columns: 1fr 1fr 1fr 80px;
    gap: 10px;
    padding: 10px 15px;
  }
  
  .header-name,
  .asset-name {
    grid-column: 1 / -1;
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
}
</style> 