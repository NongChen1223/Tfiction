import { useNovelStore } from '@/stores/novelStore'
import { useSettingsStore } from '@/stores/settingsStore'
import styles from './Reader.module.scss'

/**
 * Reader 阅读器页面
 * 小说阅读的主界面
 */
export default function Reader() {
  const { currentNovel } = useNovelStore()
  const { fontSize, fontFamily, lineHeight, backgroundColor, textColor, pageWidth } =
    useSettingsStore()

  if (!currentNovel) {
    return (
      <div className={styles.empty}>
        <p>请先打开一本小说</p>
      </div>
    )
  }

  // 获取当前章节内容
  const currentChapter = currentNovel.chapters[currentNovel.currentChapter]
  const chapterContent = currentChapter
    ? currentNovel.content.slice(currentChapter.startPos, currentChapter.endPos)
    : currentNovel.content

  return (
    <div
      className={styles.reader}
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      <div
        className={styles.content}
        style={{
          maxWidth: `${pageWidth}px`,
          fontSize: `${fontSize}px`,
          fontFamily,
          lineHeight,
        }}
      >
        {currentChapter && (
          <h2 className={styles.chapterTitle}>{currentChapter.title}</h2>
        )}
        <div className={styles.text}>{chapterContent}</div>
      </div>
    </div>
  )
}
