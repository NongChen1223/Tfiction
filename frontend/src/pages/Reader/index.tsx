import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { SearchResult } from '@/types'
import { useNovelStore } from '@/stores/novelStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useWindowStore } from '@/stores/windowStore'
import { useLibraryStore } from '@/stores/libraryStore'
import {
  OpenNovel,
  GetChapterContent,
} from '@/wailsjs/go/services/NovelService'
import { SearchInNovel } from '@/wailsjs/go/services/SearchService'
import {
  OnMouseEnter,
  OnMouseLeave,
  SetOpacity,
  ToggleStealthMode,
} from '@/wailsjs/go/services/WindowService'
import { EventsOn } from '@/wailsjs/runtime/runtime'
import { saveReadingProgress, setCurrentChapter } from '@/services/novelBridge'
import { useBossMode } from '@/hooks/useBossMode'
import { useClickOutside } from '@/hooks/useClickOutside'
import {
  buildHighlightedHtml,
  calculateProgressFromPosition,
  findChapterIndexByPosition,
  mapNovelToBook,
  normalizeNovel,
  resolveReaderFontFamily,
} from '@/utils/novel'
import { matchesShortcut } from '@/utils/shortcuts'
import styles from './Reader.module.scss'

function isPickerCancelled(error: unknown) {
  return error instanceof Error && error.message.includes('未选择文件')
}

/**
 * Reader 阅读器页面
 * 小说阅读的主界面
 */
export default function Reader() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentNovel, setCurrentNovel, patchCurrentNovel, addNovel, updateReadProgress } =
    useNovelStore()
  const {
    fontSize,
    fontFamily,
    lineHeight,
    backgroundColor,
    textColor,
    pageWidth,
    bossModeType,
    bossRevealDelay,
    bossHideDelay,
    bossOpacity,
    keyboardShortcuts,
    setBossModeType,
    setBossRevealDelay,
    setBossHideDelay,
    setBossOpacity,
  } = useSettingsStore()
  const { opacity, isStealthMode, setOpacity, setStealthMode } = useWindowStore()
  const { upsertBook, updateProgressByFilePath } = useLibraryStore()

  const [showSidebar, setShowSidebar] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [chapterContent, setChapterContent] = useState('')
  const [isLoadingChapter, setIsLoadingChapter] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<number | null>(null)
  const bossPanelRef = useRef<HTMLDivElement>(null)
  const bossMode = useBossMode({
    isStealthMode,
    bossModeType,
    revealDelay: bossRevealDelay,
    hideDelay: bossHideDelay,
  })

  const currentChapter =
    currentNovel && currentNovel.chapters.length > 0
      ? currentNovel.chapters[currentNovel.currentChapter]
      : null

  const chapterHtml = buildHighlightedHtml(chapterContent, searchKeyword)
  const displayOpacity = isStealthMode
    ? bossMode.isConcealed
      ? Math.min(opacity, 0.04)
      : opacity
    : 1
  const shouldActivateBossMode = Boolean(
    (location.state as { activateBossMode?: boolean } | null)?.activateBossMode
  )

  useClickOutside(bossPanelRef, isStealthMode && bossMode.isPanelOpen, () => {
    bossMode.closePanel()
  })

  const loadChapterContent = async (
    novelFilePath: string,
    chapterIndex: number,
    scrollMode: 'top' | 'keep' = 'top'
  ) => {
    setIsLoadingChapter(true)

    try {
      const content = await GetChapterContent(novelFilePath, chapterIndex)
      setChapterContent(content)

      requestAnimationFrame(() => {
        if (!contentRef.current) {
          return
        }

        if (scrollMode === 'top') {
          contentRef.current.scrollTop = 0
        }
      })
    } catch (error) {
      console.error('加载章节内容失败:', error)
      setChapterContent('')
    } finally {
      setIsLoadingChapter(false)
    }
  }

  const persistReadingProgress = async (chapterIndex: number, chapterScrollProgress: number) => {
    if (!currentNovel) {
      return
    }

    const progress = calculateProgressFromPosition(
      currentNovel,
      chapterIndex,
      chapterScrollProgress
    )
    const now = Date.now()

    try {
      await saveReadingProgress(currentNovel.filePath, chapterIndex, 0, progress)
    } catch (error) {
      console.error('保存阅读进度失败:', error)
    }

    patchCurrentNovel((novel) => ({
      ...novel,
      currentChapter: chapterIndex,
      readProgress: progress,
      lastReadTime: now,
    }))
    updateReadProgress(currentNovel.filePath, progress)
    updateProgressByFilePath(currentNovel.filePath, { progress, lastReadTime: now })
    upsertBook(
      mapNovelToBook(
        {
          ...currentNovel,
          currentChapter: chapterIndex,
          readProgress: progress,
          lastReadTime: now,
        },
        undefined
      )
    )
  }

  const handleOpenFile = async () => {
    try {
      const openedNovel = await OpenNovel('')
      const normalizedNovel = normalizeNovel(openedNovel)
      setCurrentNovel(normalizedNovel)
      addNovel(normalizedNovel)
      upsertBook(mapNovelToBook(normalizedNovel))
    } catch (error) {
      if (!isPickerCancelled(error)) {
        console.error('打开文件失败:', error)
      }
    }
  }

  const handleChapterChange = async (chapterIndex: number) => {
    if (!currentNovel) {
      return
    }

    try {
      await setCurrentChapter(currentNovel.filePath, chapterIndex)
      patchCurrentNovel((novel) => ({
        ...novel,
        currentChapter: chapterIndex,
      }))
      setShowSidebar(false)
      await loadChapterContent(currentNovel.filePath, chapterIndex)
      await persistReadingProgress(chapterIndex, 0)
    } catch (error) {
      console.error('切换章节失败:', error)
    }
  }

  const handlePrevChapter = () => {
    if (!currentNovel || currentNovel.currentChapter <= 0) {
      return
    }

    void handleChapterChange(currentNovel.currentChapter - 1)
  }

  const handleNextChapter = () => {
    if (!currentNovel) {
      return
    }

    if (currentNovel.currentChapter >= currentNovel.chapters.length - 1) {
      return
    }

    void handleChapterChange(currentNovel.currentChapter + 1)
  }

  const handleSearch = async () => {
    if (!searchKeyword.trim() || !currentNovel) {
      setSearchResults([])
      return
    }

    try {
      const results = await SearchInNovel(currentNovel.content, searchKeyword.trim(), false)
      setSearchResults(results || [])
    } catch (error) {
      console.error('搜索失败:', error)
    }
  }

  const jumpToSearchResult = async (result: SearchResult) => {
    if (!currentNovel) {
      return
    }

    const chapterIndex = findChapterIndexByPosition(currentNovel.chapters, result.position)
    if (chapterIndex !== currentNovel.currentChapter) {
      await handleChapterChange(chapterIndex)
    }

    requestAnimationFrame(() => {
      if (!contentRef.current) {
        return
      }

      const chapter = currentNovel.chapters[chapterIndex]
      const chapterLength = Math.max(chapter.endPos - chapter.startPos, 1)
      const localProgress = (result.position - chapter.startPos) / chapterLength
      const scrollHeight =
        contentRef.current.scrollHeight - contentRef.current.clientHeight
      contentRef.current.scrollTop = Math.max(0, scrollHeight * localProgress)
    })
  }

  const handleToggleStealthMode = async () => {
    const nextStealthMode = !isStealthMode

    try {
      await ToggleStealthMode()
      setStealthMode(nextStealthMode)

      if (nextStealthMode) {
        await SetOpacity(bossOpacity)
        setOpacity(bossOpacity)
        bossMode.revealImmediately()
      } else {
        await SetOpacity(1)
        setOpacity(1)
        bossMode.closePanel()
      }
    } catch (error) {
      console.error('切换摸鱼模式失败:', error)
    }
  }

  const handleOpacityChange = async (value: number) => {
    try {
      await SetOpacity(value)
      setOpacity(value)
      setBossOpacity(value)
      bossMode.bumpPanelTimer()
    } catch (error) {
      console.error('设置透明度失败:', error)
    }
  }

  useEffect(() => {
    if (!currentNovel) {
      setChapterContent('')
      setSearchResults([])
      return
    }

    void loadChapterContent(
      currentNovel.filePath,
      currentNovel.currentChapter || 0,
      'keep'
    )
  }, [currentNovel?.filePath, currentNovel?.currentChapter])

  useEffect(() => {
    if (!currentNovel || !shouldActivateBossMode || isStealthMode) {
      return
    }

    void handleToggleStealthMode()
    navigate(location.pathname, { replace: true, state: null })
  }, [
    currentNovel,
    handleToggleStealthMode,
    isStealthMode,
    location.pathname,
    navigate,
    shouldActivateBossMode,
  ])

  useEffect(() => {
    const offStealthMode = EventsOn('window:stealthMode', (enabled: boolean) => {
      setStealthMode(Boolean(enabled))
    })
    const offOpacity = EventsOn('window:opacity', (nextOpacity: number) => {
      setOpacity(Number(nextOpacity))
    })

    return () => {
      offStealthMode()
      offOpacity()
    }
  }, [setOpacity, setStealthMode])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingTarget =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable

      if (matchesShortcut(event, keyboardShortcuts.prevChapter) && !isTypingTarget) {
        event.preventDefault()
        handlePrevChapter()
      } else if (matchesShortcut(event, keyboardShortcuts.nextChapter) && !isTypingTarget) {
        event.preventDefault()
        handleNextChapter()
      } else if (matchesShortcut(event, keyboardShortcuts.openSearch)) {
        event.preventDefault()
        setShowSearch(true)
      } else if (matchesShortcut(event, keyboardShortcuts.toggleBossMode) && !isTypingTarget) {
        event.preventDefault()
        void handleToggleStealthMode()
      } else if (matchesShortcut(event, keyboardShortcuts.goHome) && !isTypingTarget) {
        event.preventDefault()
        navigate('/home')
      } else if (matchesShortcut(event, keyboardShortcuts.quickHide) && isStealthMode) {
        event.preventDefault()
        setShowSearch(false)
        setShowSidebar(false)
        bossMode.concealImmediately()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [bossMode, bossOpacity, currentNovel, isStealthMode, keyboardShortcuts, navigate])

  useEffect(() => {
    const contentElement = contentRef.current
    if (!contentElement || !currentNovel) {
      return
    }

    const handleScroll = () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = window.setTimeout(() => {
        if (!contentElement) {
          return
        }

        const maxScrollTop = Math.max(
          contentElement.scrollHeight - contentElement.clientHeight,
          1
        )
        const chapterScrollProgress = contentElement.scrollTop / maxScrollTop
        void persistReadingProgress(currentNovel.currentChapter, chapterScrollProgress)
      }, 200)
    }

    contentElement.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      contentElement.removeEventListener('scroll', handleScroll)
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [currentNovel?.filePath, currentNovel?.currentChapter, chapterContent])

  if (!currentNovel) {
    return (
      <div className={styles.empty}>
        <p>请先从书架导入或打开一本小说</p>
        <button onClick={handleOpenFile} className={styles.openButton}>
          打开小说文件
        </button>
      </div>
    )
  }

  return (
    <div
      className={`${styles.reader} ${isStealthMode ? styles.stealthMode : ''}`}
      onMouseEnter={() => {
        bossMode.handlePointerEnter()
        void OnMouseEnter()
      }}
      onMouseLeave={() => {
        bossMode.handlePointerLeave()
        void OnMouseLeave()
      }}
      onMouseMove={bossMode.bumpPanelTimer}
      onContextMenu={bossMode.handleContextMenu}
      style={{
        backgroundColor,
        color: textColor,
        opacity: displayOpacity,
      }}
    >
      <div
        className={`${styles.toolbar} ${
          !bossMode.isChromeVisible ? styles.chromeHidden : ''
        }`}
      >
        <div className={styles.toolbarLeft}>
          <button
            onClick={() => setShowSidebar((value) => !value)}
            className={styles.toolbarButton}
            title="目录"
          >
            📚
          </button>
          <div className={styles.chapterMeta}>
            <span className={styles.chapterInfo}>
              {currentChapter?.title || '正文'} ({currentNovel.currentChapter + 1} /{' '}
              {currentNovel.chapters.length})
            </span>
            <span className={styles.bookInfo}>{currentNovel.title}</span>
          </div>
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
            disabled={currentNovel.currentChapter >= currentNovel.chapters.length - 1}
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
            onClick={() => void handleToggleStealthMode()}
            className={`${styles.toolbarButton} ${isStealthMode ? styles.active : ''}`}
            title="摸鱼模式"
          >
            🎭
          </button>
          {isStealthMode && (
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(event) => handleOpacityChange(Number(event.target.value))}
              className={styles.opacitySlider}
              title="透明度"
            />
          )}
        </div>
      </div>

      {showSidebar && bossMode.isChromeVisible && (
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>目录</h3>
            <button onClick={() => setShowSidebar(false)} className={styles.closeButton}>
              ×
            </button>
          </div>
          <div className={styles.chapterList}>
            {currentNovel.chapters.map((chapter, index) => (
              <button
                key={`${chapter.title}-${chapter.index}`}
                className={`${styles.chapterItem} ${
                  index === currentNovel.currentChapter ? styles.active : ''
                }`}
                onClick={() => void handleChapterChange(index)}
              >
                <span className={styles.chapterItemTitle}>{chapter.title}</span>
                <span className={styles.chapterItemMeta}>{chapter.wordCount} 字</span>
              </button>
            ))}
          </div>
        </aside>
      )}

      {showSearch && bossMode.isChromeVisible && (
        <aside className={styles.searchPanel}>
          <div className={styles.searchHeader}>
            <h3>全文搜索</h3>
            <button onClick={() => setShowSearch(false)} className={styles.closeButton}>
              ×
            </button>
          </div>
          <div className={styles.searchInput}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="输入搜索关键字"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleSearch()
                }
              }}
            />
            <button onClick={() => void handleSearch()} className={styles.searchButton}>
              搜索
            </button>
          </div>
          <div className={styles.searchResults}>
            <p>{searchResults.length > 0 ? `找到 ${searchResults.length} 个匹配` : '暂无结果'}</p>
            {searchResults.map((result, index) => {
              const chapterIndex = findChapterIndexByPosition(
                currentNovel.chapters,
                result.position
              )
              const chapterTitle = currentNovel.chapters[chapterIndex]?.title || '正文'

              return (
                <button
                  key={`${result.position}-${index}`}
                  className={styles.searchResultItem}
                  onClick={() => void jumpToSearchResult(result)}
                >
                  <span className={styles.searchResultMeta}>
                    {chapterTitle} · 第 {result.line} 行
                  </span>
                  <span className={styles.searchResultText}>{result.context}</span>
                </button>
              )
            })}
          </div>
        </aside>
      )}

      <div
        ref={contentRef}
        className={`${styles.content} ${
          bossMode.isConcealed ? styles.contentConcealed : ''
        }`}
        style={{
          maxWidth: `${pageWidth}px`,
          fontSize: `${fontSize}px`,
          fontFamily: resolveReaderFontFamily(fontFamily),
          lineHeight,
        }}
      >
        {currentChapter && <h2 className={styles.chapterTitle}>{currentChapter.title}</h2>}
        {isLoadingChapter ? (
          <div className={styles.loading}>章节内容加载中...</div>
        ) : (
          <div
            className={styles.text}
            dangerouslySetInnerHTML={{
              __html: chapterHtml,
            }}
          />
        )}
      </div>

      {isStealthMode && bossMode.isConcealed && (
        <div className={styles.concealedHint}>悬停唤出阅读内容</div>
      )}

      {isStealthMode && bossMode.isPanelOpen && (
        <div
          ref={bossPanelRef}
          className={styles.bossPanel}
          style={{
            left: `${Math.min(bossMode.panelPosition.x, window.innerWidth - 260)}px`,
            top: `${Math.min(bossMode.panelPosition.y, window.innerHeight - 280)}px`,
          }}
          onMouseEnter={bossMode.bumpPanelTimer}
          onMouseMove={bossMode.bumpPanelTimer}
        >
          <div className={styles.bossPanelHeader}>
            <span>隐身控制</span>
            <button onClick={bossMode.closePanel} className={styles.panelCloseButton}>
              ×
            </button>
          </div>

          <div className={styles.bossPanelSection}>
            <span className={styles.bossPanelLabel}>当前模式</span>
            <div className={styles.segmented}>
              <button
                className={`${styles.segmentButton} ${
                  bossModeType === 'basic' ? styles.segmentActive : ''
                }`}
                onClick={() => setBossModeType('basic')}
              >
                基础
              </button>
              <button
                className={`${styles.segmentButton} ${
                  bossModeType === 'full' ? styles.segmentActive : ''
                }`}
                onClick={() => setBossModeType('full')}
              >
                完全
              </button>
            </div>
          </div>

          <div className={styles.bossPanelSection}>
            <span className={styles.bossPanelLabel}>
              透明度 {bossOpacity.toFixed(2)}
            </span>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={bossOpacity}
              onChange={(event) => handleOpacityChange(Number(event.target.value))}
              className={styles.panelSlider}
            />
          </div>

          <div className={styles.bossPanelSection}>
            <span className={styles.bossPanelLabel}>唤出延迟 {bossRevealDelay}ms</span>
            <input
              type="range"
              min="0"
              max="400"
              step="20"
              value={bossRevealDelay}
              onChange={(event) => setBossRevealDelay(Number(event.target.value))}
              className={styles.panelSlider}
            />
          </div>

          <div className={styles.bossPanelSection}>
            <span className={styles.bossPanelLabel}>隐藏延迟 {bossHideDelay}ms</span>
            <input
              type="range"
              min="80"
              max="1200"
              step="40"
              value={bossHideDelay}
              onChange={(event) => setBossHideDelay(Number(event.target.value))}
              className={styles.panelSlider}
            />
          </div>

          <div className={styles.bossPanelActions}>
            <button
              className={styles.panelActionButton}
              onClick={() => bossMode.pinVisible(!bossMode.isForceVisible)}
            >
              {bossMode.isForceVisible ? '取消常显' : '锁定常显'}
            </button>
            <button className={styles.panelActionButton} onClick={bossMode.concealImmediately}>
              立即隐藏
            </button>
            <button className={styles.panelActionButton} onClick={() => void handleToggleStealthMode()}>
              退出模式
            </button>
          </div>
        </div>
      )}

      <footer
        className={`${styles.footer} ${
          !bossMode.isChromeVisible ? styles.chromeHidden : ''
        }`}
      >
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${currentNovel.readProgress || 0}%` }}
          />
        </div>
        <div className={styles.progressInfo}>
          <span>总进度 {Number(currentNovel.readProgress || 0).toFixed(1)}%</span>
          <span>章节 {currentNovel.currentChapter + 1} / {currentNovel.chapters.length}</span>
          <span>{currentChapter?.wordCount || 0} 字</span>
        </div>
      </footer>
    </div>
  )
}
