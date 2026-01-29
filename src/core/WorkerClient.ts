import type { NetworkTimeOptions, WorkerMessage } from '../types'

/**
 * Worker 客户端
 * 主线程与 Worker 线程的通信接口
 */
export class WorkerClient {
  private worker: Worker | null = null
  private options: NetworkTimeOptions

  // 回调函数
  private onTick?: (time: number, offset: number) => void
  private onSynced?: (offset: number) => void
  private onError?: (error: Error) => void

  constructor(options: NetworkTimeOptions) {
    this.options = options
  }

  /**
   * 初始化 Worker
   */
  async init(): Promise<void> {
    try {
      // 动态导入 Worker
      // 注意：在 Vite 中，需要使用特殊的导入语法
      const workerUrl = new URL('../worker/time.worker.ts', import.meta.url)
      this.worker = new Worker(workerUrl, { type: 'module' })

      // 设置消息监听器
      this.worker.addEventListener('message', this.handleMessage.bind(this))
      this.worker.addEventListener('error', this.handleError.bind(this))

      // 发送初始化消息
      this.postMessage({
        type: 'init',
        payload: this.options
      })

      console.log('[WorkerClient] Worker 已初始化')
    } catch (error) {
      console.error('[WorkerClient] Worker 初始化失败:', error)
      throw new Error('Web Worker 不可用，请检查浏览器支持')
    }
  }

  /**
   * 启动 Worker
   */
  start(): void {
    this.postMessage({ type: 'start' })
  }

  /**
   * 停止 Worker
   */
  stop(): void {
    this.postMessage({ type: 'stop' })
  }

  /**
   * 立即同步
   */
  syncNow(): void {
    this.postMessage({ type: 'sync' })
  }

  /**
   * 销毁 Worker
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      console.log('[WorkerClient] Worker 已销毁')
    }
  }

  /**
   * 设置回调函数
   */
  setCallbacks(callbacks: {
    onTick?: (time: number, offset: number) => void
    onSynced?: (offset: number) => void
    onError?: (error: Error) => void
  }): void {
    this.onTick = callbacks.onTick
    this.onSynced = callbacks.onSynced
    this.onError = callbacks.onError
  }

  /**
   * 发送消息到 Worker
   */
  private postMessage(message: WorkerMessage): void {
    if (!this.worker) {
      console.warn('[WorkerClient] Worker 未初始化')
      return
    }

    this.worker.postMessage(message)
  }

  /**
   * 处理来自 Worker 的消息
   */
  private handleMessage(event: MessageEvent<WorkerMessage>): void {
    const { type, payload } = event.data

    switch (type) {
      case 'tick':
        if (this.onTick && payload) {
          this.onTick(payload.time, payload.offset)
        }
        break

      case 'synced':
        if (this.onSynced && payload) {
          this.onSynced(payload.offset)
        }
        break

      case 'error':
        if (this.onError && payload) {
          this.onError(new Error(payload.message))
        }
        break

      default:
        console.warn('[WorkerClient] 未知的 Worker 消息类型:', type)
    }
  }

  /**
   * 处理 Worker 错误
   */
  private handleError(event: ErrorEvent): void {
    console.error('[WorkerClient] Worker 错误:', event)
    if (this.onError) {
      this.onError(new Error(event.message))
    }
  }

  /**
   * 检查 Worker 是否可用
   */
  static isSupported(): boolean {
    return typeof Worker !== 'undefined'
  }
}
