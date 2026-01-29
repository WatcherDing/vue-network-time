import type { NetworkTimeOptions } from '../types'
import { TimeSyncClient } from './TimeSyncClient'

/**
 * 时间同步单例管理器
 * 用于在多个组件间共享同一个时间同步实例
 */
export class TimeSyncSingleton {
  private static instances: Map<string, TimeSyncClient> = new Map()
  private static refCounts: Map<string, number> = new Map()

  /**
   * 获取或创建单例实例
   * @param options 配置选项
   * @returns 时间同步客户端实例
   */
  static getInstance(options: NetworkTimeOptions): TimeSyncClient {
    const key = options.cacheKey || this.generateKey(options)

    // 如果实例已存在，增加引用计数
    if (this.instances.has(key)) {
      const count = this.refCounts.get(key) || 0
      this.refCounts.set(key, count + 1)
      return this.instances.get(key)!
    }

    // 创建新实例
    const instance = new TimeSyncClient(options)
    this.instances.set(key, instance)
    this.refCounts.set(key, 1)

    return instance
  }

  /**
   * 释放实例引用
   * 当引用计数归零时，销毁实例
   * @param options 配置选项
   */
  static releaseInstance(options: NetworkTimeOptions): void {
    const key = options.cacheKey || this.generateKey(options)

    const count = this.refCounts.get(key) || 0
    if (count <= 1) {
      // 引用计数归零，销毁实例
      const instance = this.instances.get(key)
      if (instance) {
        instance.stop()
      }
      this.instances.delete(key)
      this.refCounts.delete(key)
    } else {
      // 减少引用计数
      this.refCounts.set(key, count - 1)
    }
  }

  /**
   * 生成缓存键
   * 基于 URL 和主要配置生成唯一键
   */
  private static generateKey(options: NetworkTimeOptions): string {
    const urls = options.urls || (options.url ? [options.url] : [])
    const urlPart = urls.sort().join(',')
    const strategyPart = options.urlStrategy || 'first-success'
    const workerPart = options.useWorker ? 'worker' : 'main'
    
    return `${urlPart}:${strategyPart}:${workerPart}`
  }

  /**
   * 清除所有实例（用于测试或重置）
   */
  static clearAll(): void {
    this.instances.forEach(instance => instance.stop())
    this.instances.clear()
    this.refCounts.clear()
  }

  /**
   * 获取当前实例数量
   */
  static getInstanceCount(): number {
    return this.instances.size
  }
}
