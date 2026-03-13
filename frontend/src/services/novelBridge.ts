import {
  OpenNovel as rawOpenNovel,
  SaveReadingProgress as rawSaveReadingProgress,
  SetCurrentChapter as rawSetCurrentChapter,
} from '@/wailsjs/go/services/NovelService'

const BRIDGE_RETRY_DELAY_MS = 120
const BRIDGE_RETRY_MAX_ATTEMPTS = 25

function shouldRetryNovelService(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes("window['go']") ||
    message.includes('window.go') ||
    message.includes('services') ||
    message.includes('undefined is not an object') ||
    message.includes('cannot read properties of undefined')
  )
}

async function callNovelServiceWithRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < BRIDGE_RETRY_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (!shouldRetryNovelService(error) || attempt === BRIDGE_RETRY_MAX_ATTEMPTS - 1) {
        throw error
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, BRIDGE_RETRY_DELAY_MS)
      })
    }
  }

  throw lastError instanceof Error ? lastError : new Error('小说服务调用失败')
}

export function openNovel(filePath: string) {
  return callNovelServiceWithRetry(() => rawOpenNovel(filePath))
}

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

export function setCurrentChapter(filePath: string, chapterIndex: number) {
  return callNovelServiceWithRetry(() => rawSetCurrentChapter(filePath, chapterIndex))
}
