<template>
  <div class="time-display">
    <h2>基础时间同步示例</h2>
    
    <div class="info">
      <p><strong>当前时间：</strong>{{ now }}</p>
      <p><strong>格式化时间：</strong>{{ formatted }}</p>
      <p><strong>时间偏移：</strong>{{ offset }}ms</p>
      <p><strong>运行状态：</strong>{{ running ? '运行中' : '已停止' }}</p>
    </div>

    <div class="controls">
      <button @click="start" :disabled="running">启动同步</button>
      <button @click="stop" :disabled="!running">停止同步</button>
      <button @click="syncNow">立即同步</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useNetworkTime } from 'vue-network-time'

// 使用网络时间同步
const { now, formatted, offset, running, start, stop, syncNow } = useNetworkTime({
  // 时间源 URL（示例使用 WorldTimeAPI）
  url: 'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
  
  // 时间字段配置
  timeField: 'unixtime',
  timeFormat: 's', // WorldTimeAPI 返回秒级时间戳
  
  // 同步间隔：60秒
  syncInterval: 60000,
  
  // Tick 间隔：1秒
  tickInterval: 1000,
  
  // 时区
  timezone: 'Asia/Shanghai',
  
  // 重试配置
  retry: {
    times: 3,
    interval: 1000,
    backoff: true
  },
  
  // 调试模式
  debug: true,
  
  // 回调函数
  onSync: (time) => {
    console.log('同步成功:', new Date(time))
  },
  onError: (error) => {
    console.error('同步失败:', error)
  }
})

// 组件挂载后自动启动
onMounted(() => {
  start()
})
</script>

<style scoped>
.time-display {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.info {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

.info p {
  margin: 10px 0;
  font-size: 16px;
}

.controls {
  display: flex;
  gap: 10px;
}

.controls button {
  padding: 10px 20px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
}

.controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.controls button:hover:not(:disabled) {
  background: #45a049;
}
</style>
