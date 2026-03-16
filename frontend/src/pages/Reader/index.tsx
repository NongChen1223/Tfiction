import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { SearchResult } from '@/types'
import { useNovelStore } from '@/stores/novelStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useWindowStore } from '@/stores/windowStore'
import { useLibraryStore } from '@/stores/libraryStore'
import {
  GetChapterContent,
} from '@/wailsjs/go/services/NovelService'
import { SearchInNovel } from '@/wailsjs/go/services/SearchService'
import {
  ConsumeDesktopReaderOverlayActions,
  DisableStealthMode,
  EnableStealthMode,
  HideDesktopReaderOverlay,
  IsDesktopReaderOverlayVisible,
  OnMouseEnter,
  OnMouseLeave,
  SetOpacity,
  ShowDesktopReaderOverlay,
  SupportsDesktopReaderOverlay,
  UpdateDesktopReaderOverlay,
  UpdateDesktopReaderOverlayOpacity,
  UpdateDesktopReaderOverlayControls,
} from '@/wailsjs/go/services/WindowService'
import { EventsOn } from '@/wailsjs/runtime/runtime'
import { openNovel, saveReadingProgress, setCurrentChapter } from '@/services/novelBridge'
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

function buildDesktopOverlayText(title?: string | null, content = '') {
  const sections = [title?.trim(), content.trim()].filter(Boolean)
  return sections.join('\n\n')
}

function parseHexColor(value: string) {
  const normalized = value.trim()
  const hex = normalized.startsWith('#') ? normalized.slice(1) : normalized

  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return {
      red: parseInt(hex[0] + hex[0], 16),
      green: parseInt(hex[1] + hex[1], 16),
      blue: parseInt(hex[2] + hex[2], 16),
    }
  }

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return {
      red: parseInt(hex.slice(0, 2), 16),
      green: parseInt(hex.slice(2, 4), 16),
      blue: parseInt(hex.slice(4, 6), 16),
    }
  }

  return { red: 34, green: 34, blue: 34 }
}

function setReaderStealthRoot(enabled: boolean) {
  document.documentElement.classList.toggle('reader-stealth-active', enabled)
  document.body.classList.toggle('reader-stealth-active', enabled)
  document.getElementById('root')?.classList.toggle('reader-stealth-active', enabled)
}

interface DesktopOverlayAction {
  type: 'prev' | 'next' | 'chapter' | 'opacity' | 'close'
  chapterIndex?: number
  value?: number
}

function clampUnitInterval(value: number) {
  return Math.max(0, Math.min(1, Number(value || 0)))
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
  const [supportsDesktopOverlay, setSupportsDesktopOverlay] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<number | null>(null)
  const bossPanelRef = useRef<HTMLDivElement>(null)
  const pendingScrollProgressRef = useRef<number | null>(null)
  const overlayActionPollingRef = useRef(false)
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
  const routeState = (location.state as
    | { activateBossMode?: boolean; returnDirectoryId?: string }
    | null)
  const displayOpacity = isStealthMode
    ? bossMode.isConcealed
      ? Math.min(opacity, 0.04)
      : opacity
    : 1
  const shouldActivateBossMode = Boolean(routeState?.activateBossMode)
  const returnDirectoryId = routeState?.returnDirectoryId
  const useDesktopOverlay = supportsDesktopOverlay

  useClickOutside(bossPanelRef, isStealthMode && bossMode.isPanelOpen, () => {
    bossMode.closePanel()
  })

  const syncDesktopOverlay = async (nextOpacity = opacity) => {
    if (!useDesktopOverlay || !currentNovel) {
      return
    }

    const overlayText = buildDesktopOverlayText(currentChapter?.title, chapterContent)
    const { red, green, blue } = parseHexColor(textColor)

    await UpdateDesktopReaderOverlay(
      overlayText,
      Math.round(fontSize),
      lineHeight,
      nextOpacity,
      red,
      green,
      blue
    )
  }

  const syncDesktopOverlayControls = async (nextOpacity = opacity) => {
    if (!useDesktopOverlay || !currentNovel) {
      return
    }

    const chapterTitles = currentNovel.chapters.map((chapter) => chapter.title)
    await UpdateDesktopReaderOverlayControls(
      JSON.stringify(chapterTitles),
      currentNovel.currentChapter,
      Number(currentNovel.readProgress || 0),
      nextOpacity
    )
  }

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

        if (pendingScrollProgressRef.current !== null) {
          const maxScrollTop = Math.max(
            contentRef.current.scrollHeight - contentRef.current.clientHeight,
            0
          )
          contentRef.current.scrollTop = maxScrollTop * pendingScrollProgressRef.current
          pendingScrollProgressRef.current = null
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
  }

  const moveToReadingLocation = async (
    chapterIndex: number,
    chapterScrollProgress: number
  ) => {
    if (!currentNovel || currentNovel.chapters.length === 0) {
      return
    }

    const nextChapterIndex = Math.max(
      0,
      Math.min(chapterIndex, currentNovel.chapters.length - 1)
    )
    const nextScrollProgress = clampUnitInterval(chapterScrollProgress)

    try {
      pendingScrollProgressRef.current = nextScrollProgress
      await setCurrentChapter(currentNovel.filePath, nextChapterIndex)
      patchCurrentNovel((novel) => ({
        ...novel,
        currentChapter: nextChapterIndex,
      }))
      setShowSidebar(false)
      await loadChapterContent(
        currentNovel.filePath,
        nextChapterIndex,
        nextScrollProgress > 0 ? 'keep' : 'top'
      )
      await persistReadingProgress(nextChapterIndex, nextScrollProgress)
    } catch (error) {
      pendingScrollProgressRef.current = null
      console.error('跳转阅读位置失败:', error)
    }
  }

  const handleOpenFile = async () => {
    try {
      const openedNovel = await openNovel('')
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

    await moveToReadingLocation(chapterIndex, 0)
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
    const chapter = currentNovel.chapters[chapterIndex]
    const chapterLength = Math.max(chapter.endPos - chapter.startPos, 1)
    const localProgress = (result.position - chapter.startPos) / chapterLength

    setShowSearch(false)
    await moveToReadingLocation(chapterIndex, localProgress)
  }

  const handleToggleStealthMode = async () => {
    const nextStealthMode = !isStealthMode

    try {
      if (useDesktopOverlay) {
        if (nextStealthMode) {
          const overlayText = buildDesktopOverlayText(currentChapter?.title, chapterContent)
          const { red, green, blue } = parseHexColor(textColor)

          await ShowDesktopReaderOverlay(
            overlayText,
            Math.round(fontSize),
            lineHeight,
            bossOpacity,
            red,
            green,
            blue
          )
          await syncDesktopOverlayControls(bossOpacity)
          setStealthMode(true)
          setOpacity(bossOpacity)
          setShowSearch(false)
          setShowSidebar(false)
          bossMode.closePanel()
        } else {
          await HideDesktopReaderOverlay()
          setStealthMode(false)
          setOpacity(1)
          bossMode.closePanel()
        }

        return
      }

      if (nextStealthMode) {
        await EnableStealthMode()
        await SetOpacity(bossOpacity)
        setStealthMode(true)
        setOpacity(bossOpacity)
        bossMode.revealImmediately()
      } else {
        await DisableStealthMode()
        setStealthMode(false)
        setOpacity(1)
        bossMode.closePanel()
      }
    } catch (error) {
      console.error('切换摸鱼模式失败:', error)
    }
  }

  const handleOpacityChange = async (value: number) => {
    try {
      setOpacity(value)
      setBossOpacity(value)

      if (useDesktopOverlay && isStealthMode) {
        await UpdateDesktopReaderOverlayOpacity(value)
        await syncDesktopOverlayControls(value)
        bossMode.bumpPanelTimer()
        return
      }

      await SetOpacity(value)
      bossMode.bumpPanelTimer()
    } catch (error) {
      console.error('设置透明度失败:', error)
    }
  }

  const handleReturnHome = async () => {
    if (isStealthMode) {
      try {
        if (useDesktopOverlay) {
          await HideDesktopReaderOverlay()
        } else {
          await DisableStealthMode()
        }
        setStealthMode(false)
        setOpacity(1)
      } catch (error) {
        console.error('退出摸鱼模式失败:', error)
      }
    }

    navigate(returnDirectoryId ? `/home?directory=${encodeURIComponent(returnDirectoryId)}` : '/home')
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
    if (pendingScrollProgressRef.current === null || !contentRef.current) {
      return
    }

    requestAnimationFrame(() => {
      if (pendingScrollProgressRef.current === null || !contentRef.current) {
        return
      }

      const maxScrollTop = Math.max(
        contentRef.current.scrollHeight - contentRef.current.clientHeight,
        0
      )
      contentRef.current.scrollTop = maxScrollTop * pendingScrollProgressRef.current
      pendingScrollProgressRef.current = null
    })
  }, [chapterContent, currentNovel?.currentChapter])

  useEffect(() => {
    let disposed = false

    const detectDesktopOverlay = async () => {
      try {
        const supported = await SupportsDesktopReaderOverlay()
        if (!disposed) {
          setSupportsDesktopOverlay(Boolean(supported))
        }
      } catch {
        if (!disposed) {
          setSupportsDesktopOverlay(false)
        }
      }
    }

    void detectDesktopOverlay()

    return () => {
      disposed = true
    }
  }, [])

  useEffect(() => {
    if (!currentNovel || !shouldActivateBossMode || isStealthMode) {
      return
    }

    void handleToggleStealthMode()
    navigate(location.pathname, {
      replace: true,
      state: returnDirectoryId ? { returnDirectoryId } : null,
    })
  }, [
    currentNovel,
    handleToggleStealthMode,
    isStealthMode,
    location.pathname,
    navigate,
    returnDirectoryId,
    shouldActivateBossMode,
  ])

  useEffect(() => {
    if (useDesktopOverlay) {
      setReaderStealthRoot(false)
      return
    }

    setReaderStealthRoot(isStealthMode)

    return () => {
      setReaderStealthRoot(false)
    }
  }, [isStealthMode, useDesktopOverlay])

  useEffect(() => {
    return () => {
      setReaderStealthRoot(false)

      const windowState = useWindowStore.getState()
      if (!windowState.isStealthMode && windowState.opacity === 1) {
        return
      }

      windowState.setStealthMode(false)
      windowState.setOpacity(1)

      if (useDesktopOverlay) {
        void HideDesktopReaderOverlay().catch((error) => {
          console.error('清理桌面浮窗失败:', error)
        })
        return
      }

      void DisableStealthMode().catch((error) => {
        console.error('清理阅读摸鱼模式失败:', error)
      })
    }
  }, [useDesktopOverlay])

  useEffect(() => {
    if (!useDesktopOverlay || !isStealthMode || !currentNovel) {
      return
    }

    void syncDesktopOverlay()
  }, [
    chapterContent,
    currentChapter?.title,
    currentNovel,
    fontSize,
    lineHeight,
    textColor,
    useDesktopOverlay,
    isStealthMode,
  ])

  useEffect(() => {
    if (!useDesktopOverlay || !isStealthMode || !currentNovel) {
      return
    }

    void syncDesktopOverlayControls()
  }, [
    currentNovel,
    currentNovel?.currentChapter,
    currentNovel?.readProgress,
    useDesktopOverlay,
    isStealthMode,
  ])

  useEffect(() => {
    if (!useDesktopOverlay) {
      return
    }

    const syncOverlayState = async () => {
      try {
        const isOverlayVisible = await IsDesktopReaderOverlayVisible()
        if (isOverlayVisible || !useWindowStore.getState().isStealthMode) {
          return
        }

        await HideDesktopReaderOverlay()
        setStealthMode(false)
        setOpacity(1)
        bossMode.closePanel()
      } catch (error) {
        console.error('同步桌面浮窗状态失败:', error)
      }
    }

    const handleWindowReturn = () => {
      if (document.hidden) {
        return
      }

      void syncOverlayState()
    }

    window.addEventListener('focus', handleWindowReturn)
    document.addEventListener('visibilitychange', handleWindowReturn)

    return () => {
      window.removeEventListener('focus', handleWindowReturn)
      document.removeEventListener('visibilitychange', handleWindowReturn)
    }
  }, [bossMode, setOpacity, setStealthMode, useDesktopOverlay])

  useEffect(() => {
    if (!useDesktopOverlay || !isStealthMode) {
      return
    }

    const timer = window.setInterval(() => {
      if (overlayActionPollingRef.current) {
        return
      }

      overlayActionPollingRef.current = true
      void ConsumeDesktopReaderOverlayActions()
        .then(async (rawPayload) => {
          if (!rawPayload) {
            return
          }

          let actions: DesktopOverlayAction[] = []
          try {
            actions = JSON.parse(rawPayload) as DesktopOverlayAction[]
          } catch (error) {
            console.error('解析原生浮窗动作失败:', error)
            return
          }

          for (const action of actions) {
            if (action.type === 'prev') {
              handlePrevChapter()
            } else if (action.type === 'next') {
              handleNextChapter()
            } else if (action.type === 'chapter' && typeof action.chapterIndex === 'number') {
              await handleChapterChange(action.chapterIndex)
            } else if (action.type === 'opacity' && typeof action.value === 'number') {
              await handleOpacityChange(action.value)
            } else if (action.type === 'close') {
              await HideDesktopReaderOverlay()
              setStealthMode(false)
              setOpacity(1)
              bossMode.closePanel()
            }
          }
        })
        .catch((error) => {
          console.error('读取原生浮窗动作失败:', error)
        })
        .finally(() => {
          overlayActionPollingRef.current = false
        })
    }, 120)

    return () => {
      window.clearInterval(timer)
    }
  }, [
    bossMode,
    currentNovel,
    handleChapterChange,
    handleOpacityChange,
    handleNextChapter,
    handlePrevChapter,
    isStealthMode,
    setOpacity,
    setStealthMode,
    useDesktopOverlay,
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
        void handleReturnHome()
      } else if (matchesShortcut(event, keyboardShortcuts.quickHide) && isStealthMode) {
        event.preventDefault()
        setShowSearch(false)
        setShowSidebar(false)
        bossMode.concealImmediately()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [bossMode, bossOpacity, currentNovel, handleReturnHome, isStealthMode, keyboardShortcuts])

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
        backgroundColor: isStealthMode ? 'transparent' : backgroundColor,
        color: textColor,
      }}
    >
      <div
        className={`${styles.toolbar} ${
          !bossMode.isChromeVisible ? styles.chromeHidden : ''
        }`}
      >
        <div className={styles.toolbarLeft}>
          <button
            type="button"
            onClick={() => void handleReturnHome()}
            className={`${styles.toolbarButton} ${styles.backButton}`}
            title={returnDirectoryId ? '返回目录' : '返回书架'}
          >
            <span>{returnDirectoryId ? '返回目录' : '返回书架'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSidebar((value) => !value)}
            className={styles.toolbarButton}
            title="目录"
          >
            目录
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
            type="button"
            onClick={handlePrevChapter}
            className={styles.toolbarButton}
            disabled={currentNovel.currentChapter <= 0}
            title="上一章"
          >
            上一章
          </button>
          <button
            type="button"
            onClick={handleNextChapter}
            className={styles.toolbarButton}
            disabled={currentNovel.currentChapter >= currentNovel.chapters.length - 1}
            title="下一章"
          >
            下一章
          </button>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className={styles.toolbarButton}
            title="搜索 (Ctrl+F)"
          >
            搜索
          </button>
          <button
            type="button"
            onClick={() => void handleToggleStealthMode()}
            className={`${styles.toolbarButton} ${isStealthMode ? styles.active : ''}`}
            title="摸鱼模式"
          >
            {isStealthMode ? '退出摸鱼' : '摸鱼模式'}
          </button>
          {isStealthMode && (
            <input
              type="range"
              min="0.02"
              max="1"
              step="0.02"
              value={opacity}
              onChange={(event) => handleOpacityChange(Number(event.target.value))}
              className={styles.opacitySlider}
              title="文字可见度"
            />
          )}
        </div>
      </div>

      {showSidebar && bossMode.isChromeVisible && (
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>目录</h3>
            <button
              type="button"
              onClick={() => setShowSidebar(false)}
              className={styles.closeButton}
            >
              关闭
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
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className={styles.closeButton}
            >
              关闭
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
            <button type="button" onClick={() => void handleSearch()} className={styles.searchButton}>
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
        <div className={styles.contentBody} style={{ opacity: displayOpacity }}>
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
            <button
              type="button"
              onClick={bossMode.closePanel}
              className={styles.panelCloseButton}
            >
              收起
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
              文字可见度 {bossOpacity.toFixed(2)}
            </span>
            <input
              type="range"
              min="0.02"
              max="1"
              step="0.02"
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
              type="button"
              className={styles.panelActionButton}
              onClick={() => bossMode.pinVisible(!bossMode.isForceVisible)}
            >
              {bossMode.isForceVisible ? '取消常显' : '锁定常显'}
            </button>
            <button
              type="button"
              className={styles.panelActionButton}
              onClick={bossMode.concealImmediately}
            >
              立即隐藏
            </button>
            <button
              type="button"
              className={styles.panelActionButton}
              onClick={() => void handleToggleStealthMode()}
            >
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
