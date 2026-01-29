/**
 * 时间源策略类型
 */
export type TimeSourceStrategy = 'first-success' | 'average'

/**
 * 离线模式类型
 */
export type OfflineMode = 'local' | 'freeze' | 'error'

/**
 * 时间格式类型
 */
export type TimeFormat = 'ms' | 's' | 'iso'

/**
 * 重试配置接口
 */
export interface RetryConfig {
  /** 重试次数 */
  times: number
  /** 重试间隔（毫秒） */
  interval: number
  /** 是否启用指数退避 */
  backoff?: boolean
}

/**
 * 网络时间同步配置选项
 */
export interface NetworkTimeOptions {
  /** 单个时间源 URL */
  url?: string
  /** 多个时间源 URL */
  urls?: string[]
  /** 多 URL 策略：first-success（第一个成功）或 average（平均值） */
  urlStrategy?: TimeSourceStrategy

  /** 同步间隔（毫秒），默认 60000 */
  syncInterval?: number
  /** Tick 间隔（毫秒），默认 1000 */
  tickInterval?: number
  /** 时区，例如 'Asia/Shanghai' */
  timezone?: string

  /** 时间字段名或提取函数 */
  timeField?: string | ((resp: any) => number)
  /** 时间格式：ms（毫秒）、s（秒）、iso（ISO 字符串） */
  timeFormat?: TimeFormat
  /** 自定义时间解析函数 */
  parseTime?: (resp: any) => number

  /** 重试配置 */
  retry?: RetryConfig

  /** 离线模式：local（使用本地时间）、freeze（冻结最后时间）、error（抛出错误） */
  offlineMode?: OfflineMode

  /** 是否启用单例模式 */
  singleton?: boolean
  /** 单例缓存键 */
  cacheKey?: string

  /** 是否使用 Web Worker */
  useWorker?: boolean

  /** 是否启用调试日志 */
  debug?: boolean

  /** 错误回调 */
  onError?: (err: Error) => void
  /** 同步成功回调 */
  onSync?: (time: number) => void
  /** Tick 回调 */
  onTick?: (time: number) => void
}

/**
 * 时间同步状态
 */
export interface TimeSyncState {
  /** 当前时间戳（毫秒） */
  now: number
  /** 时间偏移量（毫秒） */
  offset: number
  /** 是否正在运行 */
  running: boolean
  /** 格式化后的时间字符串 */
  formatted: string
}

/**
 * Worker 消息类型
 */
export type WorkerMessageType = 
  | 'init'
  | 'start'
  | 'stop'
  | 'sync'
  | 'tick'
  | 'error'
  | 'synced'

/**
 * Worker 消息接口
 */
export interface WorkerMessage {
  type: WorkerMessageType
  payload?: any
}

/**
 * 时间同步响应
 */
export interface TimeSyncResponse {
  /** 服务器时间（毫秒） */
  serverTime: number
  /** 往返时间（毫秒） */
  rtt: number
  /** 请求开始时间（毫秒） */
  requestStart: number
}
