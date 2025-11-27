import { useNovelStore } from '@stores/novelStore'
import { useSettingsStore } from '@stores/settingsStore'

/**
 * NovelReader 组件
 * 小说阅读器主界面，显示小说内容
 */
export default function NovelReader() {
  const { currentNovel } = useNovelStore()
  const { fontSize, fontFamily, lineHeight, backgroundColor, textColor, pageWidth } =
    useSettingsStore()

  if (!currentNovel) {
    return null
  }

  // 获取当前章节内容
  const currentChapter = currentNovel.chapters[currentNovel.currentChapter]
  const chapterContent = currentChapter
    ? currentNovel.content.slice(currentChapter.startPos, currentChapter.endPos)
    : currentNovel.content

  return (
    <div
      className="novel-reader"
      style={{
        height: '100%',
        overflow: 'auto',
        backgroundColor,
        color: textColor,
        padding: '2rem',
      }}
    >
      <div
        className="reader-content"
        style={{
          maxWidth: pageWidth,
          margin: '0 auto',
          fontSize: `${fontSize}px`,
          fontFamily,
          lineHeight,
        }}
      >
        {currentChapter && (
          <h2
            style={{
              fontSize: `${fontSize * 1.5}px`,
              marginBottom: '2rem',
              textAlign: 'center',
            }}
          >
            {currentChapter.title}
          </h2>
        )}
        <div style={{ whiteSpace: 'pre-wrap' }}>{chapterContent}</div>
      </div>
    </div>
  )
}
