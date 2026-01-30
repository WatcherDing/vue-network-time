import type { NetworkTimeOptions, TimeSyncResponse } from '../types'
import { TimeParser } from './TimeParser'
import { DriftCorrector } from './DriftCorrector'
import { RetryStrategy } from './RetryStrategy'
import { Timezone } from './Timezone'

// Cloudflare Trace API URLs (Fallback)
const DEFAULT_CLOUDFLARE_URLS = [
  'https://one.one.one.one/cdn-cgi/trace',
  'https://1.0.0.1/cdn-cgi/trace',
  'https://cloudflare-dns.com/cdn-cgi/trace',
  'https://cloudflare-eth.com/cdn-cgi/trace',
  'https://workers.dev/cdn-cgi/trace',
  'https://pages.dev/cdn-cgi/trace',
  'https://cloudflare.tv/cdn-cgi/trace',
  'https://icanhazip.com/cdn-cgi/trace'
]

/**
 * 时间同步客户端
 * 核心时间同步逻辑的协调器
 */
export class TimeSyncClient {
  private options: Required<NetworkTimeOptions>
  private driftCorrector: DriftCorrector
  private retryStrategy: RetryStrategy
  private timezone: Timezone | null = null

  private syncTimer: number | null = null
  private tickTimer: number | null = null
  private running: boolean = false

  private currentTime: number = Date.now()
  private formattedTime: string = ''

  // 回调函数
  private onTimeUpdate?: (time: number) => void
  private onFormattedUpdate?: (formatted: string) => void
  private onOffsetUpdate?: (offset: number) => void
  private onRunningUpdate?: (running: boolean) => void

  constructor(options: NetworkTimeOptions) {
    // 合并默认选项
    this.options = this.mergeDefaultOptions(options)

    // 初始化核心组件
    this.driftCorrector = new DriftCorrector()
    this.retryStrategy = new RetryStrategy(this.options.retry)

    // 初始化时区格式化器
    if (this.options.timezone) {
      this.timezone = new Timezone(this.options.timezone)
    }

    this.log('时间同步客户端已创建', this.options)
  }

  /**
   * 合并默认选项
   */
  private mergeDefaultOptions(options: NetworkTimeOptions): Required<NetworkTimeOptions> {
    const hasUrl = !!(options.url || (options.urls && options.urls.length > 0))
    const finalUrls = options.urls || (options.url ? [options.url] : [])

    // 如果未配置 URL，使用 Cloudflare 默认源
    const urls = hasUrl ? finalUrls : DEFAULT_CLOUDFLARE_URLS
    
    // 针对 Cloudflare 默认源的特殊配置
    const timeField = options.timeField || (hasUrl ? 'time' : 'ts')
    const timeFormat = options.timeFormat || (hasUrl ? 'ms' : 's')
    
    return {
      url: options.url || '',
      urls: urls,
      urlStrategy: options.urlStrategy || 'first-success',
      syncInterval: options.syncInterval ?? 60000,
      tickInterval: options.tickInterval ?? 1000,
      timezone: options.timezone || '',
      timeField: timeField,
      timeFormat: timeFormat,
      parseTime: options.parseTime || undefined,
      retry: {
        times: options.retry?.times ?? 3,
        interval: options.retry?.interval ?? 1000,
        backoff: options.retry?.backoff ?? true
      },
      offlineMode: options.offlineMode || 'local',
      singleton: options.singleton ?? false,
      cacheKey: options.cacheKey || '',
      useWorker: options.useWorker ?? false,
      debug: options.debug ?? false,
      onError: options.onError || (() => {}),
      onSync: options.onSync || (() => {}),
      onTick: options.onTick || (() => {})
    } as Required<NetworkTimeOptions>
  }




  

  /**
   * 启动时间同步
   */
  start(): void {
    if (this.running) {
      this.log('时间同步已在运行中')
      return
    }

    this.running = true
    this.updateRunning(true)
    this.log('启动时间同步')

    // 立即执行一次同步
    this.syncNow()

    // 启动定时同步
    if (this.options.syncInterval > 0) {
      this.syncTimer = window.setInterval(() => {
        this.syncNow()
      }, this.options.syncInterval)
    }

    // 启动 tick 定时器
    if (this.options.tickInterval > 0) {
      this.tickTimer = window.setInterval(() => {
        this.tick()
      }, this.options.tickInterval)
    }
  }

  /**
   * 停止时间同步
   */
  stop(): void {
    if (!this.running) {
      return
    }

    this.log('停止时间同步')
    this.running = false
    this.updateRunning(false)

    // 清除定时器
    if (this.syncTimer !== null) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }

    if (this.tickTimer !== null) {
      clearInterval(this.tickTimer)
      this.tickTimer = null
    }
  }

  /**
   * 立即执行同步
   */
  async syncNow(): Promise<void> {
    try {
      const response = await this.performSync()
      
      // 更新偏移量
      const offset = this.driftCorrector.getOffset()
      this.updateOffset(offset)

      // 触发同步回调
      this.options.onSync(response.serverTime)
      
      this.log('同步成功', { offset, serverTime: response.serverTime })
    } catch (error) {
      this.handleSyncError(error as Error)
    }
  }

  /**
   * 执行时间同步
   */
  private async performSync(): Promise<TimeSyncResponse> {
    const urls = this.options.urls.filter(url => url)

    if (urls.length === 0) {
      throw new Error('未配置时间源 URL')
    }

    const strategy = this.options.urlStrategy

    if (strategy === 'first-success') {
      return await this.syncFirstSuccess(urls)
    } else {
      return await this.syncAverage(urls)
    }
  }

  /**
   * 第一个成功策略
   */
  private async syncFirstSuccess(urls: string[]): Promise<TimeSyncResponse> {
    for (const url of urls) {
      try {
        const response = await this.retryStrategy.execute(() => this.fetchTime(url))
        this.driftCorrector.calculateOffset(response)
        return response
      } catch (error) {
        this.log(`URL ${url} 同步失败:`, error)
        // 继续尝试下一个 URL
      }
    }

    throw new Error('所有时间源均同步失败')
  }

  /**
   * 平均值策略
   */
  private async syncAverage(urls: string[]): Promise<TimeSyncResponse> {
    const promises = urls.map(url => 
      this.retryStrategy.execute(() => this.fetchTime(url))
        .catch(error => {
          this.log(`URL ${url} 同步失败:`, error)
          return null
        })
    )

    const results = await Promise.all(promises)
    const validResults = results.filter((r): r is TimeSyncResponse => r !== null)

    if (validResults.length === 0) {
      throw new Error('所有时间源均同步失败')
    }

    // 计算平均偏移量
    this.driftCorrector.calculateAverageOffset(validResults)

    // 返回第一个有效结果（用于回调）
    return validResults[0]
  }

  /**
   * 从单个 URL 获取时间
   */
  private async fetchTime(url: string): Promise<TimeSyncResponse> {
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

    let data: any
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const text = await response.text()
      try {
        data = JSON.parse(text)
      } catch {
        // 解析 key=value 格式 (例如 Cloudflare trace)
        data = text.trim().split('\n').reduce((acc, line) => {
          const [key, value] = line.split('=')
          if (key && value) {
            acc[key.trim()] = value.trim()
          }
          return acc
        }, {} as Record<string, string>)
      }
    }

    // 解析服务器时间
    const serverTime = TimeParser.parse(
      data,
      this.options.timeField,
      this.options.timeFormat,
      this.options.parseTime as ((resp: any) => number) | undefined
    )

    // 验证时间戳
    if (!TimeParser.isValidTimestamp(serverTime)) {
      throw new Error(`无效的服务器时间: ${serverTime}`)
    }

    return {
      serverTime,
      rtt,
      requestStart
    }
  }

  /**
   * Tick 更新
   */
  private tick(): void {
    const now = this.driftCorrector.getCorrectedTime()
    this.currentTime = now
    this.updateTime(now)

    // 更新格式化时间
    if (this.timezone) {
      const formatted = this.timezone.format(now)
      this.formattedTime = formatted
      this.updateFormatted(formatted)
    }

    // 触发 tick 回调
    this.options.onTick(now)
  }

  /**
   * 处理同步错误
   */
  private handleSyncError(error: Error): void {
    this.log('同步错误:', error)
    this.options.onError(error)

    const mode = this.options.offlineMode

    if (mode === 'local') {
      // 使用本地时间
      this.log('使用本地时间')
      this.driftCorrector.reset()
    } else if (mode === 'freeze') {
      // 冻结最后的时间（不做任何操作）
      this.log('冻结时间')
    } else if (mode === 'error') {
      // 抛出错误
      throw error
    }
  }

  /**
   * 设置回调函数
   */
  onUpdate(callbacks: {
    onTime?: (time: number) => void
    onFormatted?: (formatted: string) => void
    onOffset?: (offset: number) => void
    onRunning?: (running: boolean) => void
  }): void {
    this.onTimeUpdate = callbacks.onTime
    this.onFormattedUpdate = callbacks.onFormatted
    this.onOffsetUpdate = callbacks.onOffset
    this.onRunningUpdate = callbacks.onRunning
  }

  /**
   * 更新时间
   */
  private updateTime(time: number): void {
    this.onTimeUpdate?.(time)
  }

  /**
   * 更新格式化时间
   */
  private updateFormatted(formatted: string): void {
    this.onFormattedUpdate?.(formatted)
  }

  /**
   * 更新偏移量
   */
  private updateOffset(offset: number): void {
    this.onOffsetUpdate?.(offset)
  }

  /**
   * 更新运行状态
   */
  private updateRunning(running: boolean): void {
    this.onRunningUpdate?.(running)
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      now: this.currentTime,
      offset: this.driftCorrector.getOffset(),
      running: this.running,
      formatted: this.formattedTime
    }
  }

  /**
   * 日志输出
   */
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[TimeSyncClient]', ...args)
    }
  }
}
