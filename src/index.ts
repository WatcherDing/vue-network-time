/**
 * Vue Network Time - 生产级网络时间同步 SDK
 * 
 * @packageDocumentation
 */

// 导出主要 API
export { useNetworkTime } from './vue/useNetworkTime'
export type { UseNetworkTimeReturn } from './vue/useNetworkTime'

// 导出类型定义
export type {
  NetworkTimeOptions,
  TimeSyncState,
  TimeSyncResponse,
  TimeSourceStrategy,
  TimeFormat,
  OfflineMode,
  RetryConfig,
  WorkerMessage,
  WorkerMessageType
} from './types'

// 导出核心类（高级用法）
export { TimeSyncClient } from './core/TimeSyncClient'
export { TimeSyncSingleton } from './core/TimeSyncSingleton'
export { TimeParser } from './core/TimeParser'
export { DriftCorrector } from './core/DriftCorrector'
export { RetryStrategy } from './core/RetryStrategy'
export { Timezone } from './core/Timezone'
export { WorkerClient } from './core/WorkerClient'
