<template>
  <div class="demo-container">
    <!-- 动态背景 -->
    <div class="bg-animation">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <header>
      <div class="logo">
        <span class="logo-icon">⏱</span>
        <h1>Vue Network Time</h1>
      </div>
      <p class="subtitle">生产级网络时间同步 SDK · 多时间源 · Web Worker · 企业级特性</p>
      <div class="badges">
        <span class="badge">Vue 3</span>
        <span class="badge">TypeScript</span>
        <span class="badge">Web Worker</span>
      </div>
    </header>

    <main>
      <!-- 时间对比区域 -->
      <section class="card time-compare-card">
        <div class="card-header">
          <h2>⏰ 时间对比</h2>
          <span class="badge-live" :class="{ active: running1 }">
            <span class="pulse"></span>
            {{ running1 ? 'LIVE' : 'OFFLINE' }}
          </span>
        </div>
        <div class="time-compare">
          <div class="time-block local">
            <div class="time-label">本地时间</div>
            <div class="time-value-small">{{ localTime }}</div>
          </div>
          <div class="time-diff" :class="diffClass">
            <span class="diff-arrow">{{ offset1 >= 0 ? '→' : '←' }}</span>
            <span class="diff-value">{{ Math.abs(offset1) }}ms</span>
          </div>
          <div class="time-block network">
            <div class="time-label">网络时间</div>
            <div class="time-value-small">{{ formatted1 || '--:--:--' }}</div>
          </div>
        </div>
      </section>

      <!-- 主时间显示 -->
      <section class="card hero-card">
        <div class="hero-time">
          <div class="time-digits">
            <span v-for="(digit, i) in timeDigits" :key="i" class="digit" :class="{ separator: digit === ':' }">
              {{ digit }}
            </span>
          </div>
          <div class="date-display">{{ dateDisplay }}</div>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <div class="stat-value">{{ offset1 }}</div>
            <div class="stat-label">偏移量 (ms)</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ syncCount }}</div>
            <div class="stat-label">同步次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ lastSyncTime || '--' }}</div>
            <div class="stat-label">上次同步</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" :class="statusClass">{{ statusText }}</div>
            <div class="stat-label">状态</div>
          </div>
        </div>
      </section>

      <div class="cards-grid">
        <!-- 基础模式 -->
        <section class="card mode-card">
          <div class="card-header">
            <h2>📡 基础同步模式</h2>
            <span class="status-dot" :class="running1 ? 'active' : 'inactive'"></span>
          </div>
          <div class="mode-info">
            <p>使用单一时间源进行同步，适合简单场景</p>
            <div class="config-preview">
              <code>url: 'worldtimeapi.org'</code>
              <code>syncInterval: 30s</code>
            </div>
          </div>
          <div class="controls">
            <button @click="start1" :disabled="running1" class="btn btn-primary">
              <span class="btn-icon">▶</span> 启动
            </button>
            <button @click="stop1" :disabled="!running1" class="btn btn-secondary">
              <span class="btn-icon">⏹</span> 停止
            </button>
            <button @click="handleSyncNow" class="btn btn-outline" :class="{ syncing: isSyncing }">
              <span class="btn-icon">🔄</span> 同步
            </button>
          </div>
        </section>

        <!-- 多时间源模式 -->
        <section class="card mode-card">
          <div class="card-header">
            <h2>🔄 多时间源模式</h2>
            <span class="status-dot" :class="running2 ? 'active' : 'inactive'"></span>
          </div>
          <div class="mode-info">
            <p>支持多个时间源，自动故障转移</p>
            <div class="config-preview">
              <code>策略: first-success</code>
              <code>重试: 3次</code>
            </div>
          </div>
          <div class="time-sources">
            <div class="source-item" v-for="(source, i) in timeSources" :key="i" :class="{ active: source.active }">
              <span class="source-status"></span>
              <span class="source-name">{{ source.name }}</span>
            </div>
          </div>
          <div class="controls">
            <button @click="start2" :disabled="running2" class="btn btn-primary">
              <span class="btn-icon">▶</span> 启动
            </button>
            <button @click="stop2" :disabled="!running2" class="btn btn-secondary">
              <span class="btn-icon">⏹</span> 停止
            </button>
          </div>
        </section>

        <!-- 默认模式 (Cloudflare) -->
        <section class="card mode-card">
          <div class="card-header">
            <h2>☁️ 默认模式 (Cloudflare)</h2>
            <span class="status-dot" :class="running3 ? 'active' : 'inactive'"></span>
          </div>
          <div class="mode-info">
            <p>未指定 URL 时，自动使用 Cloudflare Trace API</p>
            <div class="config-preview">
              <code>url: (default)</code>
              <code>timeField: ts</code>
            </div>
            <div style="margin-top: 10px; font-family: monospace; color: var(--text-dim);">
              {{ formatted3 || '等待同步...' }}
            </div>
          </div>
          <div class="controls">
            <button @click="start3" :disabled="running3" class="btn btn-primary">
              <span class="btn-icon">▶</span> 启动
            </button>
            <button @click="stop3" :disabled="!running3" class="btn btn-secondary">
              <span class="btn-icon">⏹</span> 停止
            </button>
          </div>
        </section>

        <!-- 特性展示 -->
        <section class="card features-card">
          <h2>✨ SDK 特性</h2>
          <div class="features-list">
            <div class="feature-item" v-for="(feature, i) in features" :key="i">
              <span class="feature-icon">{{ feature.icon }}</span>
              <div class="feature-content">
                <div class="feature-title">{{ feature.title }}</div>
                <div class="feature-desc">{{ feature.desc }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 配置演示 -->
        <section class="card config-card">
          <h2>⚙️ 配置选项</h2>
          <div class="config-demo">
            <pre class="code-block"><code>{{ configCode }}</code></pre>
          </div>
          <button class="btn btn-ghost" @click="copyConfig">
            {{ copied ? '✓ 已复制' : '📋 复制代码' }}
          </button>
        </section>
      </div>

      <!-- 日志区域 -->
      <section class="card logs-card">
        <div class="card-header">
          <h2>📋 同步日志</h2>
          <button class="btn btn-ghost btn-small" @click="clearLogs">清空</button>
        </div>
        <div class="log-container" ref="logContainer">
          <TransitionGroup name="log">
            <div v-for="(log, i) in logs" :key="log.id" class="log-item" :class="log.type">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-badge" :class="log.type">{{ log.typeText }}</span>
              <span class="log-msg">{{ log.message }}</span>
            </div>
          </TransitionGroup>
          <div v-if="logs.length === 0" class="log-empty">
            <span class="empty-icon">📭</span>
            <span>暂无日志，启动同步后将显示日志信息</span>
          </div>
        </div>
      </section>
    </main>

    <footer>
      <div class="footer-content">
        <p>Vue Network Time SDK v1.0.0</p>
        <div class="footer-links">
          <a href="https://github.com/WatcherDing/vue-network-time" target="_blank">GitHub</a>
          <span class="divider">·</span>
          <a href="https://github.com/WatcherDing/vue-network-time#readme" target="_blank">文档</a>
          <span class="divider">·</span>
          <a href="https://github.com/WatcherDing/vue-network-time/issues" target="_blank">问题反馈</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useNetworkTime } from '../src'

interface LogItem {
  id: number
  time: string
  message: string
  type: 'info' | 'success' | 'error' | 'warn'
  typeText: string
}

// 日志
const logs = ref<LogItem[]>([])
const logContainer = ref<HTMLElement | null>(null)
let logId = 0

const addLog = (message: string, type: LogItem['type'] = 'info') => {
  const now = new Date()
  const typeTextMap = { info: '信息', success: '成功', error: '错误', warn: '警告' }
  logs.value.unshift({
    id: logId++,
    time: now.toLocaleTimeString('zh-CN'),
    message,
    type,
    typeText: typeTextMap[type]
  })
  if (logs.value.length > 30) {
    logs.value.pop()
  }
}

const clearLogs = () => {
  logs.value = []
  addLog('日志已清空', 'info')
}

// 本地时间
const localTime = ref('')
const localTimeInterval = ref<number | null>(null)

// 同步状态
const syncCount = ref(0)
const lastSyncTime = ref('')
const isSyncing = ref(false)

// 基础同步模式
const {
  now: now1,
  formatted: formatted1,
  offset: offset1,
  running: running1,
  start: start1,
  stop: stop1,
  syncNow: syncNow1
} = useNetworkTime({
  url: 'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
  timeField: 'unixtime',
  timeFormat: 's',
  timezone: 'Asia/Shanghai',
  syncInterval: 30000,
  tickInterval: 1000,
  debug: true,
  onSync: (time: number) => {
    syncCount.value++
    lastSyncTime.value = new Date().toLocaleTimeString('zh-CN')
    addLog(`基础模式同步成功: ${new Date(time).toLocaleString('zh-CN')}`, 'success')
  },
  onError: (err: Error) => {
    addLog(`基础模式同步失败: ${err.message}`, 'error')
  }
})

// 多时间源模式
const {
  now: now2,
  formatted: formatted2,
  offset: offset2,
  running: running2,
  start: start2,
  stop: stop2
} = useNetworkTime({
  urls: [
    'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
    'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Shanghai'
  ],
  urlStrategy: 'first-success',
  timeField: (resp: any) => {
    if (resp.unixtime) return resp.unixtime * 1000
    if (resp.dateTime) return new Date(resp.dateTime).getTime()
    return Date.now()
  },
  timezone: 'Asia/Shanghai',
  syncInterval: 30000,
  tickInterval: 1000,
  retry: {
    times: 3,
    interval: 2000,
    backoff: true
  },
  onSync: (time: number) => {
    addLog(`多源模式同步成功: ${new Date(time).toLocaleString('zh-CN')}`, 'success')
  },
  onError: (err: Error) => {
    addLog(`多源模式同步失败: ${err.message}`, 'error')
  }
})

// 默认模式 (Cloudflare)
const {
  now: now3,
  formatted: formatted3,
  offset: offset3,
  running: running3,
  start: start3,
  stop: stop3
} = useNetworkTime({
  timezone: 'Asia/Shanghai',
  syncInterval: 30000,
  onSync: (time: number) => {
    addLog(`默认模式(Cloudflare)同步成功: ${new Date(time).toLocaleString('zh-CN')}`, 'success')
  },
  onError: (err: Error) => {
    addLog(`默认模式同步失败: ${err.message}`, 'error')
  }
})

// 计算属性
const timeDigits = computed(() => {
  if (!formatted1.value) return ['0', '0', ':', '0', '0', ':', '0', '0']
  const match = formatted1.value.match(/(\d{2}):(\d{2}):(\d{2})/)
  if (match) {
    return [...match[1], ':', ...match[2], ':', ...match[3]]
  }
  return ['0', '0', ':', '0', '0', ':', '0', '0']
})

const dateDisplay = computed(() => {
  if (!formatted1.value) return '----年--月--日'
  const match = formatted1.value.match(/(\d{4})\/(\d{2})\/(\d{2})/)
  if (match) {
    return `${match[1]}年${match[2]}月${match[3]}日`
  }
  return formatted1.value.split(' ')[0] || '----年--月--日'
})

const diffClass = computed(() => {
  const abs = Math.abs(offset1.value)
  if (abs < 100) return 'diff-good'
  if (abs < 500) return 'diff-warn'
  return 'diff-bad'
})

const statusClass = computed(() => {
  if (!running1.value) return 'status-inactive'
  return 'status-active'
})

const statusText = computed(() => {
  if (!running1.value) return '已停止'
  if (isSyncing.value) return '同步中...'
  return '运行中'
})

// 时间源状态
const timeSources = ref([
  { name: 'WorldTimeAPI', active: true },
  { name: 'TimeAPI.io', active: false }
])

// 特性列表
const features = [
  { icon: '🌐', title: '多时间源', desc: '支持多个 NTP 服务器，自动故障转移' },
  { icon: '⚡', title: 'Web Worker', desc: '后台线程同步，不阻塞 UI' },
  { icon: '🔄', title: '自动重试', desc: '指数退避重试策略' },
  { icon: '🌍', title: '时区支持', desc: '内置时区格式化' },
  { icon: '📦', title: 'TypeScript', desc: '完整的类型定义' },
  { icon: '🎯', title: '漂移校正', desc: '智能时钟漂移检测与校正' }
]

// 配置代码
const configCode = `import { useNetworkTime } from 'vue-network-time'

const { now, formatted, start, stop } = useNetworkTime({
  url: 'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
  timezone: 'Asia/Shanghai',
  syncInterval: 60000,
  onSync: (time) => console.log('Synced:', time)
})`

const copied = ref(false)
const copyConfig = async () => {
  try {
    await navigator.clipboard.writeText(configCode)
    copied.value = true
    addLog('配置代码已复制到剪贴板', 'info')
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    addLog('复制失败，请手动复制', 'warn')
  }
}

// 手动同步
const handleSyncNow = async () => {
  isSyncing.value = true
  addLog('正在手动同步...', 'info')
  try {
    await syncNow1()
  } finally {
    setTimeout(() => { isSyncing.value = false }, 500)
  }
}

// 更新本地时间
const updateLocalTime = () => {
  localTime.value = new Date().toLocaleTimeString('zh-CN')
}

onMounted(() => {
  addLog('Demo 应用已启动', 'info')
  start1()
  start2()
  start3()
  updateLocalTime()
  localTimeInterval.value = window.setInterval(updateLocalTime, 1000)
})

onUnmounted(() => {
  if (localTimeInterval.value) {
    clearInterval(localTimeInterval.value)
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary: #667eea;
  --primary-light: #818cf8;
  --secondary: #764ba2;
  --success: #4ade80;
  --warning: #fbbf24;
  --error: #f87171;
  --bg-dark: #0f0f1a;
  --bg-card: rgba(255, 255, 255, 0.03);
  --border: rgba(255, 255, 255, 0.08);
  --text: #ffffff;
  --text-muted: #94a3b8;
  --text-dim: #64748b;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-dark);
  min-height: 100vh;
  color: var(--text);
  overflow-x: hidden;
}

/* 背景动画 */
.bg-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float 20s infinite ease-in-out;
}

.circle-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  top: -200px;
  right: -200px;
  animation-delay: 0s;
}

.circle-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  bottom: -100px;
  left: -100px;
  animation-delay: -7s;
}

.circle-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  top: 50%;
  left: 50%;
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -30px) scale(1.1); }
  50% { transform: translate(-20px, 20px) scale(0.9); }
  75% { transform: translate(-30px, -20px) scale(1.05); }
}

.demo-container {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* Header */
header {
  text-align: center;
  margin-bottom: 48px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.logo-icon {
  font-size: 3rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), var(--secondary), #ec4899);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient 3s linear infinite;
}

@keyframes gradient {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

.subtitle {
  color: var(--text-muted);
  font-size: 1.1rem;
  margin-bottom: 16px;
}

.badges {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  font-size: 12px;
  color: var(--text-muted);
}

/* Cards */
main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 24px;
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  transition: all 0.3s ease;
}

.card:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
}

/* 时间对比卡片 */
.time-compare-card {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
}

.badge-live {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(248, 113, 113, 0.2);
  color: var(--error);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-live.active {
  background: rgba(74, 222, 128, 0.2);
  color: var(--success);
}

.pulse {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.time-compare {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.time-block {
  text-align: center;
  padding: 16px 24px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
  min-width: 180px;
}

.time-label {
  font-size: 12px;
  color: var(--text-dim);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.time-value-small {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.time-block.local .time-value-small {
  color: var(--text-muted);
}

.time-block.network .time-value-small {
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.time-diff {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
}

.diff-arrow {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.diff-value {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
}

.diff-good { color: var(--success); }
.diff-good .diff-value { background: rgba(74, 222, 128, 0.2); }

.diff-warn { color: var(--warning); }
.diff-warn .diff-value { background: rgba(251, 191, 36, 0.2); }

.diff-bad { color: var(--error); }
.diff-bad .diff-value { background: rgba(248, 113, 113, 0.2); }

/* Hero 时间卡片 */
.hero-card {
  text-align: center;
  padding: 40px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08));
}

.hero-time {
  margin-bottom: 32px;
}

.time-digits {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 12px;
}

.digit {
  font-size: 4rem;
  font-weight: 800;
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: linear-gradient(180deg, var(--text) 0%, var(--text-muted) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  min-width: 50px;
  text-align: center;
}

.digit.separator {
  min-width: auto;
  background: linear-gradient(180deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: blink 1s infinite;
}

.date-display {
  font-size: 1.2rem;
  color: var(--text-muted);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--text);
}

.stat-label {
  font-size: 12px;
  color: var(--text-dim);
  margin-top: 4px;
}

.status-active { color: var(--success); }
.status-inactive { color: var(--text-dim); }

/* Cards Grid */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

/* Mode Cards */
.mode-card {
  display: flex;
  flex-direction: column;
}

.mode-info {
  flex: 1;
  margin-bottom: 16px;
}

.mode-info p {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 12px;
}

.config-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.config-preview code {
  font-size: 11px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  color: var(--primary-light);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--text-dim);
}

.status-dot.active {
  background: var(--success);
  box-shadow: 0 0 10px var(--success);
}

.status-dot.inactive {
  background: var(--text-dim);
}

/* Time Sources */
.time-sources {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.source-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-muted);
}

.source-status {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-dim);
}

.source-item.active .source-status {
  background: var(--success);
}

/* Buttons */
.controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: inherit;
}

.btn-icon {
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}

.btn-outline:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--primary);
}

.btn-outline.syncing {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  padding: 8px 16px;
}

.btn-ghost:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.05);
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

/* Features Card */
.features-card h2 {
  margin-bottom: 20px;
}

.features-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.feature-item:hover {
  background: rgba(0, 0, 0, 0.3);
  transform: translateX(4px);
}

.feature-icon {
  font-size: 1.25rem;
}

.feature-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 2px;
}

.feature-desc {
  font-size: 12px;
  color: var(--text-dim);
}

/* Config Card */
.config-demo {
  margin-bottom: 16px;
}

.code-block {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
  padding: 16px;
  overflow-x: auto;
}

.code-block code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: var(--primary-light);
  white-space: pre;
  line-height: 1.6;
}

/* Logs Card */
.logs-card {
  max-height: 400px;
}

.log-container {
  max-height: 280px;
  overflow-y: auto;
  padding-right: 8px;
}

.log-container::-webkit-scrollbar {
  width: 4px;
}

.log-container::-webkit-scrollbar-track {
  background: transparent;
}

.log-container::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}

.log-time {
  color: var(--text-dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  min-width: 70px;
}

.log-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.log-badge.info {
  background: rgba(148, 163, 184, 0.2);
  color: var(--text-muted);
}

.log-badge.success {
  background: rgba(74, 222, 128, 0.2);
  color: var(--success);
}

.log-badge.error {
  background: rgba(248, 113, 113, 0.2);
  color: var(--error);
}

.log-badge.warn {
  background: rgba(251, 191, 36, 0.2);
  color: var(--warning);
}

.log-msg {
  color: var(--text-muted);
  flex: 1;
}

.log-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px;
  color: var(--text-dim);
  font-size: 14px;
}

.empty-icon {
  font-size: 2rem;
  opacity: 0.5;
}

/* Log Transition */
.log-enter-active {
  transition: all 0.3s ease;
}

.log-leave-active {
  transition: all 0.2s ease;
}

.log-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.log-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Footer */
footer {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.footer-content {
  text-align: center;
}

footer p {
  color: var(--text-dim);
  font-size: 13px;
  margin-bottom: 12px;
}

.footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.footer-links a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13px;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: var(--primary);
}

.divider {
  color: var(--text-dim);
}

/* Responsive */
@media (max-width: 768px) {
  .demo-container {
    padding: 20px 16px;
  }

  header h1 {
    font-size: 1.8rem;
  }

  .digit {
    font-size: 2.5rem;
    min-width: 32px;
  }

  .hero-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .features-list {
    grid-template-columns: 1fr;
  }

  .time-compare {
    flex-direction: column;
  }

  .time-diff {
    transform: rotate(90deg);
  }
}
</style>
