import {
  OpenNovel as rawOpenNovel,
  SaveReadingProgress as rawSaveReadingProgress,
  SetCurrentChapter as rawSetCurrentChapter,
} from '@/wailsjs/go/services/NovelService'

const BRIDGE_RETRY_DELAY_MS = 120
const BRIDGE_RETRY_MAX_ATTEMPTS = 25

function getNovelServiceErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') {
      return message
    }

    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }

  return String(error || '')
}

function normalizeNovelServiceError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message.trim()) {
    return error
  }

  const message = getNovelServiceErrorMessage(error).trim()
  return new Error(message || fallbackMessage)
}

// Wails 绑定在窗口刚初始化时可能尚未挂载完成，这类错误允许短暂重试。
function shouldRetryNovelService(error: unknown) {
  const message = getNovelServiceErrorMessage(error).toLowerCase()
  return (
    message.includes("window['go']") ||
    message.includes('window.go') ||
    message.includes('services') ||
    message.includes('novelservice') ||
    message.includes('go is undefined') ||
    message.includes('undefined is not an object') ||
    message.includes('cannot read properties of undefined')
  )
}

// 统一处理前端调用小说服务时的短暂未就绪状态，避免页面首次进入时偶发失败。
async function callNovelServiceWithRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < BRIDGE_RETRY_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (!shouldRetryNovelService(error) || attempt === BRIDGE_RETRY_MAX_ATTEMPTS - 1) {
        throw normalizeNovelServiceError(error, '小说服务调用失败')
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, BRIDGE_RETRY_DELAY_MS)
      })
    }
  }

  throw normalizeNovelServiceError(lastError, '小说服务调用失败')
}

// 打开小说文件；传空路径时由后端弹出系统文件选择器。
export function openNovel(filePath: string) {
  return callNovelServiceWithRetry(() => rawOpenNovel(filePath))
}

// 持久化当前章节和进度，供继续阅读、书架进度展示等场景复用。
export function saveReadingProgress(
  filePath: string,
  chapterIndex: number,
  position: number,
  progress: number
) {
  return callNovelServiceWithRetry(() =>
    rawSaveReadingProgress(filePath, chapterIndex, position, progress)
  )
}

// 仅同步后端记录的当前章节，不负责加载正文内容。
export function setCurrentChapter(filePath: string, chapterIndex: number) {
  return callNovelServiceWithRetry(() => rawSetCurrentChapter(filePath, chapterIndex))
}
