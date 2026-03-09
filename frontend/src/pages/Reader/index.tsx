import { useState, useEffect, useRef } from 'react'
import { useNovelStore } from '@/stores/novelStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useWindowStore } from '@/stores/windowStore'
import { OpenNovel, GetChapterContent, SetCurrentChapter, SaveReadingProgress } from '@/wailsjs/go/services/NovelService'
import { SearchInNovel } from '@/wailsjs/go/services/SearchService'
import { SetOpacity, ToggleStealthMode } from '@/wailsjs/go/services/WindowService'
import styles from './Reader.module.scss'

/**
 * Reader 阅读器页面
 * 小说阅读的主界面
 */
export default function Reader() {
  const { currentNovel, setCurrentNovel } = useNovelStore()
  const {
    fontSize,
    fontFamily,
    lineHeight,
    backgroundColor,
    textColor,
    pageWidth,
  } = useSettingsStore()
  const { opacity, isStealthMode, setOpacity } = useWindowStore()

  const [showSidebar, setShowSidebar] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [highlightedContent, setHighlightedContent] = useState('')

  const contentRef = useRef<HTMLDivElement>(null)

  // 获取当前章节内容
  const currentChapter =
    currentNovel && currentNovel.chapters
      ? currentNovel.chapters[currentNovel.currentChapter]
      : null

  const chapterContent = currentChapter
    ? currentNovel.content.slice(currentChapter.startPos, currentChapter.endPos)
    : currentNovel?.content || ''

  // 打开文件
  const handleOpenFile = async () => {
    try {
      const novel = await OpenNovel('')
      if (novel) {
        setCurrentNovel(novel)
      }
    } catch (error) {
      console.error('打开文件失败:', error)
    }
  }

  // 切换章节
  const handleChapterChange = async (chapterIndex: number) => {
    if (!currentNovel) return

    try {
      const content = await GetChapterContent(currentNovel.filePath, chapterIndex)
      await SetCurrentChapter(currentNovel.filePath, chapterIndex)
      await SaveReadingProgress(currentNovel.filePath, chapterIndex, 0, 0)
      setCurrentNovel({
        ...currentNovel,
        currentChapter: chapterIndex,
      })
      setShowSidebar(false)
    } catch (error) {
      console.error('切换章节失败:', error)
    }
  }

  // 上一章
  const handlePrevChapter = () => {
    if (!currentNovel || currentNovel.currentChapter <= 0) return
    handleChapterChange(currentNovel.currentChapter - 1)
  }

  // 下一章
  const handleNextChapter = () => {
    if (!currentNovel || !currentNovel.chapters) return
    if (currentNovel.currentChapter >= currentNovel.chapters.length - 1) return
    handleChapterChange(currentNovel.currentChapter + 1)
  }

  // 搜索功能
  const handleSearch = async () => {
    if (!searchKeyword || !currentNovel) return

    try {
      const results = await SearchInNovel(currentNovel.content, searchKeyword, false)
      setSearchResults(results || [])
    } catch (error) {
      console.error('搜索失败:', error)
    }
  }

  // 高亮显示搜索关键字
  const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text
    const regex = new RegExp(`(${keyword})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  // 切换摸鱼模式
  const handleToggleStealthMode = async () => {
    try {
      await ToggleStealthMode()
    } catch (error) {
      console.error('切换摸鱼模式失败:', error)
    }
  }

  // 调整透明度
  const handleOpacityChange = async (value: number) => {
    try {
      await SetOpacity(value)
      setOpacity(value)
    } catch (error) {
      console.error('设置透明度失败:', error)
    }
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevChapter()
      } else if (e.key === 'ArrowRight') {
        handleNextChapter()
      } else if (e.key === 'f' && e.ctrlKey) {
        e.preventDefault()
        setShowSearch(true)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentNovel])

  if (!currentNovel) {
    return (
      <div className={styles.empty}>
        <p>请先打开一本小说</p>
        <button onClick={handleOpenFile} className={styles.openButton}>
          打开小说文件
        </button>
      </div>
    )
  }

  return (
    <div
      className={`${styles.reader} ${isStealthMode ? styles.stealthMode : ''}`}
      style={{
        backgroundColor,
        color: textColor,
        opacity: isStealthMode ? opacity : 1,
      }}
    >
      {/* 工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={styles.toolbarButton}
            title="目录"
          >
            📚
          </button>
          <span className={styles.chapterInfo}>
            {currentChapter && (
              <>
                {currentChapter.title} ({currentNovel.currentChapter + 1} /{' '}
                {currentNovel.chapters.length})
              </>
            )}
          </span>
        </div>

        <div className={styles.toolbarCenter}>
          <button
            onClick={handlePrevChapter}
            className={styles.toolbarButton}
            disabled={currentNovel.currentChapter <= 0}
            title="上一章"
          >
            ←
          </button>
          <button
            onClick={handleNextChapter}
            className={styles.toolbarButton}
            disabled={
              !currentNovel.chapters ||
              currentNovel.currentChapter >= currentNovel.chapters.length - 1
            }
            title="下一章"
          >
            →
          </button>
        </div>

        <div className={styles.toolbarRight}>
          <button
            onClick={() => setShowSearch(true)}
            className={styles.toolbarButton}
            title="搜索 (Ctrl+F)"
          >
            🔍
          </button>
          <button
            onClick={handleToggleStealthMode}
            className={`${styles.toolbarButton} ${isStealthMode ? styles.active : ''}`}
            title="摸鱼模式"
          >
            🎭
          </button>
          {isStealthMode && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
              className={styles.opacitySlider}
              title="透明度"
            />
          )}
        </div>
      </div>

      {/* 侧边栏 */}
      {showSidebar && (
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>目录</h3>
            <button onClick={() => setShowSidebar(false)} className={styles.closeButton}>
              ×
            </button>
          </div>
          <div className={styles.chapterList}>
            {currentNovel.chapters.map((chapter, index) => (
              <div
                key={index}
                className={`${styles.chapterItem} ${
                  index === currentNovel.currentChapter ? styles.active : ''
                }`}
                onClick={() => handleChapterChange(index)}
              >
                {chapter.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 搜索面板 */}
      {showSearch && (
        <div className={styles.searchPanel}>
          <div className={styles.searchHeader}>
            <h3>搜索</h3>
            <button onClick={() => setShowSearch(false)} className={styles.closeButton}>
              ×
            </button>
          </div>
          <div className={styles.searchInput}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="输入搜索关键字"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
            />
            <button onClick={handleSearch} className={styles.searchButton}>
              搜索
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className={styles.searchResults}>
              <p>找到 {searchResults.length} 个匹配</p>
              {searchResults.map((result, index) => (
                <div key={index} className={styles.searchResultItem}>
                  <p>位置: {result.position}</p>
                  <p>{result.context}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 阅读区域 */}
      <div
        ref={contentRef}
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
        <div
          className={styles.text}
          dangerouslySetInnerHTML={{
            __html: highlightText(chapterContent, searchKeyword),
          }}
        />
      </div>

      {/* 底部进度条 */}
      <div className={styles.footer}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${currentNovel.readProgress || 0}%` }}
          />
        </div>
        <div className={styles.progressInfo}>
          {currentNovel.readProgress && (
            <span>阅读进度: {currentNovel.readProgress.toFixed(1)}%</span>
          )}
        </div>
      </div>
    </div>
  )
}
