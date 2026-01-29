import type { WorkerMessage, NetworkTimeOptions, TimeSyncResponse } from '../types'

/**
 * Web Worker 时间同步
 * 在独立线程中运行，防止浏览器标签页挂起影响时间同步
 */

// Worker 内部状态
let offset: number = 0
let syncTimer: number | null = null
let tickTimer: number | null = null
let options: NetworkTimeOptions = {}

/**
 * 消息处理器
 */
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data

  try {
    switch (type) {
      case 'init':
        handleInit(payload)
        break
      case 'start':
        handleStart()
        break
      case 'stop':
        handleStop()
        break
      case 'sync':
        await handleSync()
        break
      default:
        console.warn('未知的 Worker 消息类型:', type)
    }
  } catch (error) {
    postMessage({
      type: 'error',
      payload: {
        message: error instanceof Error ? error.message : String(error)
      }
    } as WorkerMessage)
  }
})

/**
 * 初始化
 */
function handleInit(config: NetworkTimeOptions): void {
  options = config
  console.log('[Worker] 已初始化', options)
}

/**
 * 启动同步
 */
function handleStart(): void {
  console.log('[Worker] 启动时间同步')

  // 立即同步一次
  handleSync()

  // 启动定时同步
  const syncInterval = options.syncInterval ?? 60000
  if (syncInterval > 0) {
    syncTimer = self.setInterval(() => {
      handleSync()
    }, syncInterval)
  }

  // 启动 tick 定时器
  const tickInterval = options.tickInterval ?? 1000
  if (tickInterval > 0) {
    tickTimer = self.setInterval(() => {
      tick()
    }, tickInterval)
  }
}

/**
 * 停止同步
 */
function handleStop(): void {
  console.log('[Worker] 停止时间同步')

  if (syncTimer !== null) {
    clearInterval(syncTimer)
    syncTimer = null
  }

  if (tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

/**
 * 执行同步
 */
async function handleSync(): Promise<void> {
  const urls = options.urls || (options.url ? [options.url] : [])
  
  if (urls.length === 0) {
    throw new Error('未配置时间源 URL')
  }

  const strategy = options.urlStrategy || 'first-success'

  try {
    if (strategy === 'first-success') {
      await syncFirstSuccess(urls)
    } else {
      await syncAverage(urls)
    }

    // 发送同步成功消息
    postMessage({
      type: 'synced',
      payload: { offset }
    } as WorkerMessage)
  } catch (error) {
    throw new Error(`同步失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 第一个成功策略
 */
async function syncFirstSuccess(urls: string[]): Promise<void> {
  for (const url of urls) {
    try {
      const response = await fetchTime(url)
      offset = calculateOffset(response)
      console.log('[Worker] 同步成功', { url, offset })
      return
    } catch (error) {
      console.warn(`[Worker] URL ${url} 同步失败:`, error)
    }
  }

  throw new Error('所有时间源均同步失败')
}

/**
 * 平均值策略
 */
async function syncAverage(urls: string[]): Promise<void> {
  const promises = urls.map(url => 
    fetchTime(url).catch(error => {
      console.warn(`[Worker] URL ${url} 同步失败:`, error)
      return null
    })
  )

  const results = await Promise.all(promises)
  const validResults = results.filter((r): r is TimeSyncResponse => r !== null)

  if (validResults.length === 0) {
    throw new Error('所有时间源均同步失败')
  }

  // 计算平均偏移量
  const offsets = validResults.map(resp => 
    resp.serverTime - (resp.requestStart + resp.rtt / 2)
  )
  offset = offsets.reduce((sum, o) => sum + o, 0) / offsets.length

  console.log('[Worker] 平均同步成功', { offset, sources: validResults.length })
}

/**
 * 从 URL 获取时间
 */
async function fetchTime(url: string): Promise<TimeSyncResponse> {
  const requestStart = Date.now()

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-cache'
  })

  const requestEnd = Date.now()
  const rtt = requestEnd - requestStart

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()

  // 解析服务器时间
  const serverTime = parseTime(data)

  return {
    serverTime,
    rtt,
    requestStart
  }
}

/**
 * 解析时间
 */
function parseTime(data: any): number {
  const timeField = options.timeField || 'time'
  const timeFormat = options.timeFormat || 'ms'

  let value: any

  if (typeof timeField === 'string') {
    // 支持嵌套字段
    value = timeField.split('.').reduce((obj, key) => obj?.[key], data)
  } else {
    value = data.time ?? data.timestamp ?? data.serverTime ?? data
  }

  // 标准化为毫秒
  if (typeof value === 'number') {
    return timeFormat === 's' ? value * 1000 : value
  }

  if (typeof value === 'string') {
    return new Date(value).getTime()
  }

  throw new Error('无法解析服务器时间')
}

/**
 * 计算偏移量
 */
function calculateOffset(response: TimeSyncResponse): number {
  const { serverTime, rtt, requestStart } = response
  return serverTime - (requestStart + rtt / 2)
}

/**
 * Tick 更新
 */
function tick(): void {
  const now = Date.now() + offset

  postMessage({
    type: 'tick',
    payload: { time: now, offset }
  } as WorkerMessage)
}

// 导出类型（仅用于类型检查）
export {}
