import { models } from '@/wailsjs/go/models'

type NovelServiceBridge = {
  OpenNovel: (filePath: string) => Promise<models.Novel>
  SaveReadingProgress: (
    filePath: string,
    chapterIndex: number,
    position: number,
    progress: number
  ) => Promise<void>
  SetCurrentChapter: (filePath: string, chapterIndex: number) => Promise<void>
}

const BRIDGE_POLL_INTERVAL_MS = 60
const BRIDGE_READY_TIMEOUT_MS = 3000

async function getNovelServiceBridge() {
  const startedAt = Date.now()

  while (Date.now() - startedAt < BRIDGE_READY_TIMEOUT_MS) {
    const bridge = (window as typeof window & {
      go?: {
        services?: {
          NovelService?: NovelServiceBridge
        }
      }
    }).go?.services?.NovelService

    if (bridge) {
      return bridge
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, BRIDGE_POLL_INTERVAL_MS)
    })
  }

  throw new Error('桌面服务尚未就绪，请稍后重试')
}

export async function openNovel(filePath: string) {
  const bridge = await getNovelServiceBridge()
  return bridge.OpenNovel(filePath)
}

export async function saveReadingProgress(
  filePath: string,
  chapterIndex: number,
  position: number,
  progress: number
) {
  const bridge = await getNovelServiceBridge()
  return bridge.SaveReadingProgress(
    filePath,
    chapterIndex,
    position,
    progress
  )
}

export async function setCurrentChapter(filePath: string, chapterIndex: number) {
  const bridge = await getNovelServiceBridge()
  return bridge.SetCurrentChapter(filePath, chapterIndex)
}
