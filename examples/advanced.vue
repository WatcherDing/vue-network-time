<template>
  <div class="advanced-time">
    <h2>高级时间同步示例</h2>
    
    <div class="features">
      <div class="feature-card">
        <h3>多时间源 + 平均策略</h3>
        <p>当前时间：{{ now1 }}</p>
        <p>偏移量：{{ offset1 }}ms</p>
        <p>状态：{{ running1 ? '运行中' : '已停止' }}</p>
      </div>

      <div class="feature-card">
        <h3>Web Worker 模式</h3>
        <p>当前时间：{{ now2 }}</p>
        <p>格式化：{{ formatted2 }}</p>
        <p>状态：{{ running2 ? '运行中' : '已停止' }}</p>
      </div>

      <div class="feature-card">
        <h3>单例模式</h3>
        <p>当前时间：{{ now3 }}</p>
        <p>偏移量：{{ offset3 }}ms</p>
        <p>状态：{{ running3 ? '运行中' : '已停止' }}</p>
      </div>
    </div>

    <div class="controls">
      <button @click="startAll">全部启动</button>
      <button @click="stopAll">全部停止</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useNetworkTime } from 'vue-network-time'

// 示例 1: 多时间源 + 平均策略
const {
  now: now1,
  offset: offset1,
  running: running1,
  start: start1,
  stop: stop1
} = useNetworkTime({
  urls: [
    'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
    'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Shanghai',
    'http://worldclockapi.com/api/json/utc/now'
  ],
  urlStrategy: 'average', // 使用平均策略
  timeField: (resp) => {
    // 自定义解析函数，适配不同 API
    if (resp.unixtime) return resp.unixtime * 1000
    if (resp.dateTime) return new Date(resp.dateTime).getTime()
    if (resp.currentDateTime) return new Date(resp.currentDateTime).getTime()
    return Date.now()
  },
  syncInterval: 30000,
  retry: {
    times: 5,
    interval: 2000,
    backoff: true
  },
  debug: true
})

// 示例 2: Web Worker 模式（防止标签页挂起）
const {
  now: now2,
  formatted: formatted2,
  running: running2,
  start: start2,
  stop: stop2
} = useNetworkTime({
  url: 'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
  timeField: 'unixtime',
  timeFormat: 's',
  timezone: 'Asia/Shanghai',
  useWorker: true, // 启用 Web Worker
  syncInterval: 60000,
  tickInterval: 1000,
  debug: true
})

// 示例 3: 单例模式（多组件共享）
const {
  now: now3,
  offset: offset3,
  running: running3,
  start: start3,
  stop: stop3
} = useNetworkTime({
  url: 'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
  timeField: 'unixtime',
  timeFormat: 's',
  singleton: true, // 启用单例模式
  cacheKey: 'global-time', // 自定义缓存键
  syncInterval: 60000,
  debug: true
})

const startAll = () => {
  start1()
  start2()
  start3()
}

const stopAll = () => {
  stop1()
  stop2()
  stop3()
}

onMounted(() => {
  startAll()
})
</script>

<style scoped>
.advanced-time {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.feature-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.feature-card h3 {
  margin-top: 0;
  font-size: 18px;
}

.feature-card p {
  margin: 10px 0;
  font-size: 14px;
}

.controls {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.controls button {
  padding: 12px 24px;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  background: #667eea;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.controls button:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
</style>
