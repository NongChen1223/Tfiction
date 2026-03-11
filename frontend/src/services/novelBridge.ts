type NovelServiceBridge = {
  SaveReadingProgress: (
    filePath: string,
    chapterIndex: number,
    position: number,
    progress: number
  ) => Promise<void>
  SetCurrentChapter: (filePath: string, chapterIndex: number) => Promise<void>
}

function getNovelServiceBridge() {
  return (window as typeof window & {
    go: {
      services: {
        NovelService: NovelServiceBridge
      }
    }
  }).go.services.NovelService
}

export function saveReadingProgress(
  filePath: string,
  chapterIndex: number,
  position: number,
  progress: number
) {
  return getNovelServiceBridge().SaveReadingProgress(
    filePath,
    chapterIndex,
    position,
    progress
  )
}

export function setCurrentChapter(filePath: string, chapterIndex: number) {
  return getNovelServiceBridge().SetCurrentChapter(filePath, chapterIndex)
}
