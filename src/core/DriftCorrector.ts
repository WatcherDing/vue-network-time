import type { TimeSyncResponse } from '../types'

/**
 * 时间漂移修正器
 * 使用 RTT（往返时间）算法计算和修正本地时间偏移
 */
export class DriftCorrector {
  private offset: number = 0
  private lastSyncTime: number = 0
  private rttHistory: number[] = []
  private readonly maxHistorySize = 10

  /**
   * 计算时间偏移量
   * 算法：offset = serverTime - (requestStart + RTT / 2)
   * 
   * @param response 时间同步响应
   * @returns 计算出的偏移量（毫秒）
   */
  calculateOffset(response: TimeSyncResponse): number {
    const { serverTime, rtt, requestStart } = response

    // 验证 RTT
    if (rtt < 0) {
      throw new Error('RTT 不能为负数')
    }

    if (rtt > 10000) {
      console.warn(`RTT 过大 (${rtt}ms)，网络延迟可能影响时间精度`)
    }

    // 计算偏移量：服务器时间 - (请求开始时间 + RTT的一半)
    // RTT的一半代表单程延迟的估计值
    const calculatedOffset = serverTime - (requestStart + rtt / 2)

    // 记录 RTT 历史用于分析
    this.rttHistory.push(rtt)
    if (this.rttHistory.length > this.maxHistorySize) {
      this.rttHistory.shift()
    }

    this.offset = calculatedOffset
    this.lastSyncTime = Date.now()

    return calculatedOffset
  }

  /**
   * 计算多个时间源的平均偏移量
   * @param responses 多个时间同步响应
   * @returns 平均偏移量
   */
  calculateAverageOffset(responses: TimeSyncResponse[]): number {
    if (responses.length === 0) {
      throw new Error('至少需要一个时间响应')
    }

    // 计算每个响应的偏移量
    const offsets = responses.map(resp => {
      const { serverTime, rtt, requestStart } = resp
      return serverTime - (requestStart + rtt / 2)
    })

    // 计算平均值
    const avgOffset = offsets.reduce((sum, offset) => sum + offset, 0) / offsets.length

    // 计算标准差以评估一致性
    const variance = offsets.reduce((sum, offset) => {
      return sum + Math.pow(offset - avgOffset, 2)
    }, 0) / offsets.length
    const stdDev = Math.sqrt(variance)

    // 如果标准差过大，发出警告
    if (stdDev > 1000) {
      console.warn(`时间源偏差较大 (标准差: ${stdDev.toFixed(2)}ms)，可能存在不可靠的时间源`)
    }

    this.offset = avgOffset
    this.lastSyncTime = Date.now()

    return avgOffset
  }

  /**
   * 获取当前修正后的时间
   * @returns 修正后的时间戳（毫秒）
   */
  getCorrectedTime(): number {
    return Date.now() + this.offset
  }

  /**
   * 获取当前偏移量
   */
  getOffset(): number {
    return this.offset
  }

  /**
   * 获取上次同步时间
   */
  getLastSyncTime(): number {
    return this.lastSyncTime
  }

  /**
   * 获取平均 RTT
   */
  getAverageRTT(): number {
    if (this.rttHistory.length === 0) return 0
    return this.rttHistory.reduce((sum, rtt) => sum + rtt, 0) / this.rttHistory.length
  }

  /**
   * 重置偏移量
   */
  reset(): void {
    this.offset = 0
    this.lastSyncTime = 0
    this.rttHistory = []
  }
}
