/**
 * 时区格式化器
 * 使用 Intl.DateTimeFormat 进行时区转换和格式化
 */
export class Timezone {
  private formatter: Intl.DateTimeFormat | null = null
  private timezone: string

  constructor(timezone: string = 'UTC') {
    this.timezone = timezone
    this.createFormatter()
  }

  /**
   * 创建格式化器
   */
  private createFormatter(): void {
    try {
      this.formatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: this.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    } catch (error) {
      console.warn(`时区 "${this.timezone}" 不支持，回退到 UTC`, error)
      this.timezone = 'UTC'
      this.formatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    }
  }

  /**
   * 格式化时间戳
   * @param timestamp 时间戳（毫秒）
   * @returns 格式化后的时间字符串
   */
  format(timestamp: number): string {
    if (!this.formatter) {
      return new Date(timestamp).toISOString()
    }

    try {
      return this.formatter.format(new Date(timestamp))
    } catch (error) {
      console.error('时间格式化失败:', error)
      return new Date(timestamp).toISOString()
    }
  }

  /**
   * 使用自定义选项格式化
   * @param timestamp 时间戳（毫秒）
   * @param options Intl.DateTimeFormat 选项
   * @returns 格式化后的时间字符串
   */
  formatCustom(timestamp: number, options: Intl.DateTimeFormatOptions): string {
    try {
      const formatter = new Intl.DateTimeFormat('zh-CN', {
        ...options,
        timeZone: this.timezone
      })
      return formatter.format(new Date(timestamp))
    } catch (error) {
      console.error('自定义格式化失败:', error)
      return this.format(timestamp)
    }
  }

  /**
   * 获取当前时区
   */
  getTimezone(): string {
    return this.timezone
  }

  /**
   * 设置新时区
   */
  setTimezone(timezone: string): void {
    this.timezone = timezone
    this.createFormatter()
  }

  /**
   * 验证时区是否有效
   */
  static isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
      return true
    } catch {
      return false
    }
  }
}
