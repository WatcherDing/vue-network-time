import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import type { NetworkTimeOptions } from '../types'
import { TimeSyncClient } from '../core/TimeSyncClient'
import { TimeSyncSingleton } from '../core/TimeSyncSingleton'
import { WorkerClient } from '../core/WorkerClient'

/**
 * useNetworkTime 返回值接口
 */
export interface UseNetworkTimeReturn {
  /** 当前时间戳（毫秒） */
  now: Ref<number>
  /** 格式化后的时间字符串 */
  formatted: Ref<string>
  /** 时间偏移量（毫秒） */
  offset: Ref<number>
  /** 是否正在运行 */
  running: Ref<boolean>
  /** 启动时间同步 */
  start: () => void
  /** 停止时间同步 */
  stop: () => void
  /** 立即同步 */
  syncNow: () => Promise<void>
}

/**
 * Vue 网络时间同步 Composable
 * 
 * @example
 * ```ts
 * const { now, formatted, start, stop } = useNetworkTime({
 *   url: 'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
 *   timezone: 'Asia/Shanghai',
 *   syncInterval: 60000
 * })
 * 
 * onMounted(() => start())
 * ```
 */
export function useNetworkTime(options: NetworkTimeOptions): UseNetworkTimeReturn {
  // 响应式状态
  const now = ref<number>(Date.now())
  const formatted = ref<string>('')
  const offset = ref<number>(0)
  const running = ref<boolean>(false)

  // 客户端实例
  let client: TimeSyncClient | null = null
  let workerClient: WorkerClient | null = null
  let isWorkerMode = false

  /**
   * 初始化客户端
   */
  const initClient = async (): Promise<void> => {
    // 检查是否使用 Worker 模式
    if (options.useWorker && WorkerClient.isSupported()) {
      isWorkerMode = true
      await initWorkerMode()
    } else {
      initMainThreadMode()
    }
  }

  /**
   * 初始化主线程模式
   */
  const initMainThreadMode = (): void => {
    // 检查是否使用单例模式
    if (options.singleton) {
      client = TimeSyncSingleton.getInstance(options)
    } else {
      client = new TimeSyncClient(options)
    }

    // 设置回调
    client.onUpdate({
      onTime: (time) => {
        now.value = time
      },
      onFormatted: (fmt) => {
        formatted.value = fmt
      },
      onOffset: (off) => {
        offset.value = off
      },
      onRunning: (run) => {
        running.value = run
      }
    })

    // 初始化状态
    const state = client.getState()
    now.value = state.now
    formatted.value = state.formatted
    offset.value = state.offset
    running.value = state.running
  }

  /**
   * 初始化 Worker 模式
   */
  const initWorkerMode = async (): Promise<void> => {
    workerClient = new WorkerClient(options)

    // 设置回调
    workerClient.setCallbacks({
      onTick: (time, off) => {
        now.value = time
        offset.value = off

        // 如果配置了时区，在主线程格式化
        // （Worker 中无法使用 Intl API 的某些特性）
        if (options.timezone) {
          formatted.value = formatTime(time, options.timezone)
        }
      },
      onSynced: (off) => {
        offset.value = off
        if (options.onSync) {
          options.onSync(Date.now() + off)
        }
      },
      onError: (error) => {
        if (options.onError) {
          options.onError(error)
        }
      }
    })

    // 初始化 Worker
    await workerClient.init()
  }

  /**
   * 格式化时间
   */
  const formatTime = (timestamp: number, timezone: string): string => {
    try {
      const formatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
      return formatter.format(new Date(timestamp))
    } catch {
      return new Date(timestamp).toISOString()
    }
  }

  /**
   * 启动时间同步
   */
  const start = (): void => {
    if (isWorkerMode && workerClient) {
      workerClient.start()
      running.value = true
    } else if (client) {
      client.start()
    }
  }

  /**
   * 停止时间同步
   */
  const stop = (): void => {
    if (isWorkerMode && workerClient) {
      workerClient.stop()
      running.value = false
    } else if (client) {
      client.stop()
    }
  }

  /**
   * 立即同步
   */
  const syncNow = async (): Promise<void> => {
    if (isWorkerMode && workerClient) {
      workerClient.syncNow()
    } else if (client) {
      await client.syncNow()
    }
  }

  /**
   * 组件挂载时初始化
   */
  onMounted(async () => {
    await initClient()
  })

  /**
   * 组件卸载时清理
   */
  onUnmounted(() => {
    // 停止同步
    stop()

    // 清理资源
    if (isWorkerMode && workerClient) {
      workerClient.destroy()
      workerClient = null
    } else if (client) {
      // 如果是单例模式，释放引用
      if (options.singleton) {
        TimeSyncSingleton.releaseInstance(options)
      } else {
        client.stop()
      }
      client = null
    }
  })

  return {
    now,
    formatted,
    offset,
    running,
    start,
    stop,
    syncNow
  }
}
