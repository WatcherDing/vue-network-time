import type { TimeFormat } from '../types'

/**
 * 时间解析器
 * 负责从各种格式中解析时间戳
 */
export class TimeParser {
  /**
   * 从响应中解析时间
   * @param response 服务器响应
   * @param timeField 时间字段名或提取函数
   * @param timeFormat 时间格式
   * @param parseTime 自定义解析函数
   * @returns 时间戳（毫秒）
   */
  static parse(
    response: any,
    timeField?: string | ((resp: any) => number),
    timeFormat: TimeFormat = 'ms',
    parseTime?: (resp: any) => number
  ): number {
    // 优先使用自定义解析函数
    if (parseTime) {
      return this.normalize(parseTime(response), timeFormat)
    }

    let value: any

    // 使用字段提取
    if (typeof timeField === 'function') {
      value = timeField(response)
    } else if (typeof timeField === 'string') {
      value = this.getNestedValue(response, timeField)
    } else {
      // 默认尝试常见字段
      value = response.time ?? response.timestamp ?? response.serverTime ?? response
    }

    return this.normalize(value, timeFormat)
  }

  /**
   * 标准化时间值为毫秒时间戳
   */
  private static normalize(value: any, format: TimeFormat): number {
    if (typeof value === 'number') {
      // 数字类型
      if (format === 's') {
        return value * 1000
      }
      return value
    }

    if (typeof value === 'string') {
      // 尝试解析数字字符串 (例如 "1706500000.123")
      if (format === 's' || format === 'ms') {
        const num = parseFloat(value)
        if (!isNaN(num) && isFinite(num)) {
          if (format === 's') {
            return num * 1000
          }
          return num
        }
      }

      // ISO 字符串或其他字符串格式
      const parsed = new Date(value).getTime()
      if (isNaN(parsed)) {
        throw new Error(`无法解析时间字符串: ${value}`)
      }
      return parsed
    }

    throw new Error(`不支持的时间值类型: ${typeof value}`)
  }

  /**
   * 获取嵌套对象的值
   * 支持 'data.time' 这样的路径
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * 验证时间戳是否合理
   * @param timestamp 时间戳（毫秒）
   * @returns 是否有效
   */
  static isValidTimestamp(timestamp: number): boolean {
    // 检查是否为有效数字
    if (!Number.isFinite(timestamp)) {
      return false
    }

    // 检查是否在合理范围内（2000年 - 2100年）
    const min = new Date('2000-01-01').getTime()
    const max = new Date('2100-01-01').getTime()
    
    return timestamp >= min && timestamp <= max
  }
}
