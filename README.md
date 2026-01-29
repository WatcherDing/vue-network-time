# Vue Network Time

<p align="center">
  <strong>🕐 生产级 Vue 3 网络时间同步 SDK</strong>
</p>

<p align="center">
  支持多时间源、Web Worker、时区格式化等企业级特性
</p>

## ✨ 特性

- 🎯 **精确同步** - 基于 NTP 算法的 RTT 时间漂移修正
- 🔄 **多时间源** - 支持多个时间源，提供 first-success 和 average 两种策略
- 🚀 **Web Worker** - 后台线程同步，防止浏览器标签页挂起影响时间精度
- 🌍 **时区支持** - 基于 Intl.DateTimeFormat 的时区格式化
- 🔁 **自动重试** - 可配置的重试次数和指数退避策略
- 💾 **单例模式** - 多组件共享同一实例，避免重复请求
- 📦 **TypeScript** - 完整的类型定义和类型安全
- 🌲 **Tree-shaking** - 模块化设计，支持按需引入
- ⚡ **轻量级** - 核心代码约 15-20KB（minified）

## 📦 安装

```bash
# npm
npm install vue-network-time

# pnpm
pnpm add vue-network-time

# yarn
yarn add vue-network-time
```

## 🚀 快速开始

```vue
<template>
  <div>
    <p>当前时间: {{ now }}</p>
    <p>格式化时间: {{ formatted }}</p>
    <p>时间偏移: {{ offset }}ms</p>
    <button @click="start">启动</button>
    <button @click="stop">停止</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useNetworkTime } from 'vue-network-time'

const { now, formatted, offset, running, start, stop, syncNow } = useNetworkTime({
  url: 'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
  timeField: 'unixtime',
  timeFormat: 's',
  timezone: 'Asia/Shanghai',
  syncInterval: 60000,
  debug: true
})

onMounted(() => start())
</script>
```

## 📖 API 文档

### `useNetworkTime(options)`

主要的 Vue 3 组合式函数。

#### 参数：`NetworkTimeOptions`

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `url` | `string` | - | 单个时间源 URL |
| `urls` | `string[]` | - | 多个时间源 URL |
| `urlStrategy` | `'first-success' \| 'average'` | `'first-success'` | 多 URL 策略 |
| `syncInterval` | `number` | `60000` | 同步间隔（毫秒） |
| `tickInterval` | `number` | `1000` | Tick 间隔（毫秒） |
| `timezone` | `string` | - | 时区（如 'Asia/Shanghai'） |
| `timeField` | `string \| (resp: any) => number` | `'time'` | 时间字段名或提取函数 |
| `timeFormat` | `'ms' \| 's' \| 'iso'` | `'ms'` | 时间格式 |
| `parseTime` | `(resp: any) => number` | - | 自定义解析函数 |
| `retry` | `RetryConfig` | `{ times: 3, interval: 1000, backoff: true }` | 重试配置 |
| `offlineMode` | `'local' \| 'freeze' \| 'error'` | `'local'` | 离线模式 |
| `singleton` | `boolean` | `false` | 是否启用单例模式 |
| `cacheKey` | `string` | - | 单例缓存键 |
| `useWorker` | `boolean` | `false` | 是否使用 Web Worker |
| `debug` | `boolean` | `false` | 是否启用调试日志 |
| `onError` | `(err: Error) => void` | - | 错误回调 |
| `onSync` | `(time: number) => void` | - | 同步成功回调 |
| `onTick` | `(time: number) => void` | - | Tick 回调 |

#### 返回值：`UseNetworkTimeReturn`

| 属性 | 类型 | 说明 |
|------|------|------|
| `now` | `Ref<number>` | 当前时间戳（毫秒） |
| `formatted` | `Ref<string>` | 格式化后的时间字符串 |
| `offset` | `Ref<number>` | 时间偏移量（毫秒） |
| `running` | `Ref<boolean>` | 是否正在运行 |
| `start` | `() => void` | 启动时间同步 |
| `stop` | `() => void` | 停止时间同步 |
| `syncNow` | `() => Promise<void>` | 立即同步 |

## 💡 使用示例

### 多时间源 + 平均策略

```ts
const { now, offset } = useNetworkTime({
  urls: [
    'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
    'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Shanghai'
  ],
  urlStrategy: 'average', // 使用多个时间源的平均值
  timeField: (resp) => {
    // 自定义解析函数，适配不同 API
    if (resp.unixtime) return resp.unixtime * 1000
    if (resp.dateTime) return new Date(resp.dateTime).getTime()
    return Date.now()
  }
})
```

### Web Worker 模式

```ts
const { now, formatted } = useNetworkTime({
  url: 'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
  useWorker: true, // 在 Worker 中运行，防止标签页挂起
  timezone: 'Asia/Shanghai',
  syncInterval: 60000
})
```

### 单例模式（多组件共享）

```ts
// 组件 A
const time1 = useNetworkTime({
  url: 'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
  singleton: true,
  cacheKey: 'global-time'
})

// 组件 B（共享同一实例，不会重复请求）
const time2 = useNetworkTime({
  url: 'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
  singleton: true,
  cacheKey: 'global-time'
})
```

### 自定义重试策略

```ts
const { now } = useNetworkTime({
  url: 'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
  retry: {
    times: 5,           // 重试 5 次
    interval: 2000,     // 初始间隔 2 秒
    backoff: true       // 启用指数退避
  }
})
```

### 离线模式处理

```ts
const { now } = useNetworkTime({
  url: 'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
  offlineMode: 'local', // 'local' | 'freeze' | 'error'
  onError: (error) => {
    console.error('同步失败:', error)
  }
})
```

## 🔧 核心算法

### RTT 时间漂移修正

本 SDK 使用类似 NTP 的算法计算时间偏移：

```
offset = serverTime - (requestStart + RTT / 2)
correctedTime = Date.now() + offset
```

其中：
- `serverTime`: 服务器返回的时间戳
- `requestStart`: 请求开始时间
- `RTT`: 往返时间（Round Trip Time）

### 多时间源策略

**First-Success（默认）**
- 按顺序尝试每个时间源
- 使用第一个成功的响应
- 速度快，适合对精度要求不高的场景

**Average**
- 并发请求所有时间源
- 计算所有成功响应的平均偏移量
- 精度高，适合对时间精度要求高的场景

## ⚠️ 注意事项

### CORS 要求

时间 API 必须支持 CORS，否则会出现跨域错误。推荐的公共时间 API：

- [WorldTimeAPI](https://worldtimeapi.org/)
- [TimeAPI](https://timeapi.io/)
- [WorldClockAPI](http://worldclockapi.com/)

### Web Worker 限制

- 需要 HTTPS 环境（生产环境）
- 某些浏览器可能不支持 Worker
- Worker 中无法访问 DOM

### 时区支持

- 依赖浏览器的 `Intl.DateTimeFormat` API
- 需要现代浏览器支持
- 时区标识符遵循 IANA 标准

## 📊 性能指标

- **包大小**: ~15-20KB (minified)
- **内存占用**: 单实例 ~1-2KB，Worker 额外 ~5KB
- **网络请求**: 可配置同步间隔，默认 60 秒
- **时间精度**: ±10-50ms（取决于网络延迟）

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 类型检查
pnpm run type-check

# 构建
pnpm run build
```

## 📄 License

MIT License © 2026

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！