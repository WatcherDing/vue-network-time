import type { RetryConfig } from '../types'

/**
 * 重试策略
 * 支持固定间隔和指数退避
 */
export class RetryStrategy {
  private currentAttempt: number = 0
  private readonly config: Required<RetryConfig>

  constructor(config: RetryConfig = { times: 3, interval: 1000 }) {
    this.config = {
      times: config.times,
      interval: config.interval,
      backoff: config.backoff ?? true
    }
  }

  /**
   * 执行带重试的异步操作
   * @param fn 要执行的异步函数
   * @param onRetry 重试时的回调
   * @returns 操作结果
   */
  async execute<T>(
    fn: () => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    this.currentAttempt = 0

    while (true) {
      try {
        const result = await fn()
        this.currentAttempt = 0 // 成功后重置
        return result
      } catch (error) {
        this.currentAttempt++

        if (this.currentAttempt >= this.config.times) {
          // 达到最大重试次数
          throw new Error(
            `操作失败，已重试 ${this.config.times} 次: ${error instanceof Error ? error.message : String(error)}`
          )
        }

        // 调用重试回调
        if (onRetry) {
          onRetry(this.currentAttempt, error instanceof Error ? error : new Error(String(error)))
        }

        // 等待后重试
        await this.wait()
      }
    }
  }

  /**
   * 等待指定时间
   * 如果启用指数退避，等待时间会随重试次数增加
   */
  private wait(): Promise<void> {
    const delay = this.config.backoff
      ? this.config.interval * Math.pow(2, this.currentAttempt - 1)
      : this.config.interval

    return new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * 获取当前重试次数
   */
  getCurrentAttempt(): number {
    return this.currentAttempt
  }

  /**
   * 重置重试计数
   */
  reset(): void {
    this.currentAttempt = 0
  }
}
