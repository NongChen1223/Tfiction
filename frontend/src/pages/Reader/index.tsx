import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { CamouflageWidgetPosition, SearchResult } from '@/types'
import { useNovelStore } from '@/stores/novelStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { getPersistedBossOpacity } from '@/stores/settingsStore'
import { useWindowStore } from '@/stores/windowStore'
import { useLibraryStore } from '@/stores/libraryStore'
import ReadingAppearanceControls from '@/components/features/ReadingAppearanceControls'
import CamouflagePendant from '@/components/features/CamouflagePendant'
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
  buildDesktopOverlayMarkup,
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

const MIN_STEALTH_OPACITY = 0.02
const MAX_STEALTH_OPACITY = 1
const CAMOUFLAGE_ANIMATION_MS = 240
const CAMOUFLAGE_WIDGET_WIDTH = 156
const CAMOUFLAGE_WIDGET_HEIGHT = 92
const CAMOUFLAGE_VIEWPORT_PADDING = 16

type CamouflageStage = 'expanded' | 'collapsing' | 'collapsed' | 'expanding'

function clampStealthOpacity(value: number) {
  return Math.max(MIN_STEALTH_OPACITY, Math.min(MAX_STEALTH_OPACITY, Number(value || 0)))
}

function opacityToTransparencySliderValue(opacity: number) {
  return Number((MIN_STEALTH_OPACITY + MAX_STEALTH_OPACITY - clampStealthOpacity(opacity)).toFixed(2))
}

function transparencySliderValueToOpacity(value: number) {
  return clampStealthOpacity(MIN_STEALTH_OPACITY + MAX_STEALTH_OPACITY - Number(value || 0))
}

function setReaderStealthRoot(enabled: boolean) {
  document.documentElement.classList.toggle('reader-stealth-active', enabled)
  document.body.classList.toggle('reader-stealth-active', enabled)
  document.getElementById('root')?.classList.toggle('reader-stealth-active', enabled)
}

interface DesktopOverlayAction {
  type: 'prev' | 'next' | 'chapter' | 'opacity' | 'close' | 'camouflage'
  chapterIndex?: number
  value?: number
}

function clampUnitInterval(value: number) {
  return Math.max(0, Math.min(1, Number(value || 0)))
}


function clampCamouflageRatio(value: number) {
  return Math.max(0, Math.min(1, Number(value || 0)))
}

function normalizeCamouflageWidgetPosition(position: CamouflageWidgetPosition) {
  return {
    x: clampCamouflageRatio(position.x),
    y: clampCamouflageRatio(position.y),
  }
}

function getCamouflageTravelSize() {
  if (typeof window === 'undefined') {
    return { x: 1, y: 1 }
  }

  return {
    x: Math.max(
      window.innerWidth - CAMOUFLAGE_WIDGET_WIDTH - CAMOUFLAGE_VIEWPORT_PADDING * 2,
      1
    ),
    y: Math.max(
      window.innerHeight - CAMOUFLAGE_WIDGET_HEIGHT - CAMOUFLAGE_VIEWPORT_PADDING * 2,
      1
    ),
  }
}

function buildCamouflageWidgetStyle(position: CamouflageWidgetPosition): CSSProperties {
  const normalized = normalizeCamouflageWidgetPosition(position)

  return {
    left: `calc(${CAMOUFLAGE_VIEWPORT_PADDING}px + ${normalized.x} * (100vw - ${CAMOUFLAGE_WIDGET_WIDTH}px - ${CAMOUFLAGE_VIEWPORT_PADDING * 2}px))`,
    top: `calc(${CAMOUFLAGE_VIEWPORT_PADDING}px + ${normalized.y} * (100vh - ${CAMOUFLAGE_WIDGET_HEIGHT}px - ${CAMOUFLAGE_VIEWPORT_PADDING * 2}px))`,
  }
}

function buildCamouflageTransformOrigin(position: CamouflageWidgetPosition) {
  const normalized = normalizeCamouflageWidgetPosition(position)

  return `calc(${CAMOUFLAGE_VIEWPORT_PADDING}px + ${normalized.x} * (100vw - ${CAMOUFLAGE_WIDGET_WIDTH}px - ${CAMOUFLAGE_VIEWPORT_PADDING * 2}px) + ${CAMOUFLAGE_WIDGET_WIDTH / 2}px) calc(${CAMOUFLAGE_VIEWPORT_PADDING}px + ${normalized.y} * (100vh - ${CAMOUFLAGE_WIDGET_HEIGHT}px - ${CAMOUFLAGE_VIEWPORT_PADDING * 2}px) + ${CAMOUFLAGE_WIDGET_HEIGHT / 2}px)`
}

function hasWailsRuntimeEvents() {
  if (typeof window === 'undefined') {
    return false
  }

  const runtime = (window as Window & {
    runtime?: { EventsOnMultiple?: unknown }
  }).runtime

  return typeof runtime?.EventsOnMultiple === 'function'
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
    bossCamouflageEnabled,
    bossCamouflageWidgetPosition,
    keyboardShortcuts,
    setFontSize,
    setFontFamily,
    setLineHeight,
    setPageWidth,
    setBackgroundColor,
    setTextColor,
    setBossModeType,
    setBossRevealDelay,
    setBossHideDelay,
    setBossOpacity,
    setBossCamouflageEnabled,
    setBossCamouflageWidgetPosition,
  } = useSettingsStore()
  const { opacity, isStealthMode, setOpacity, setStealthMode } = useWindowStore()
  const { upsertBook, updateProgressByFilePath } = useLibraryStore()

  const [showSidebar, setShowSidebar] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showAppearancePanel, setShowAppearancePanel] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [chapterContent, setChapterContent] = useState('')
  const [isLoadingChapter, setIsLoadingChapter] = useState(false)
  const [supportsDesktopOverlay, setSupportsDesktopOverlay] = useState(false)
  const [camouflageStage, setCamouflageStage] = useState<CamouflageStage>('expanded')
  const [camouflageWidgetPosition, setCamouflageWidgetPosition] = useState<CamouflageWidgetPosition>(
    normalizeCamouflageWidgetPosition(bossCamouflageWidgetPosition)
  )
  const [isDraggingCamouflageWidget, setIsDraggingCamouflageWidget] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<number | null>(null)
  const appearancePanelRef = useRef<HTMLDivElement>(null)
  const bossPanelRef = useRef<HTMLDivElement>(null)
  const pendingScrollProgressRef = useRef<number | null>(null)
  const overlayActionPollingRef = useRef(false)
  const camouflageTimerRef = useRef<number | null>(null)
  const camouflageDragCleanupRef = useRef<(() => void) | null>(null)
  const useDesktopOverlay = supportsDesktopOverlay
  const isWebviewStealthMode = isStealthMode && !useDesktopOverlay
  const bossMode = useBossMode({
    isStealthMode: isWebviewStealthMode,
    bossModeType,
    revealDelay: bossRevealDelay,
    hideDelay: bossHideDelay,
  })

  const currentChapter =
    currentNovel && currentNovel.chapters.length > 0
      ? currentNovel.chapters[currentNovel.currentChapter]
      : null

  const isEpubChapterContent = currentNovel?.format === '.epub'
  const chapterHtml = isEpubChapterContent
    ? chapterContent || '<p>暂无内容</p>'
    : buildHighlightedHtml(chapterContent, searchKeyword)
  const overlayChapterMarkup = buildDesktopOverlayMarkup(
    currentChapter?.title,
    chapterContent,
    Boolean(isEpubChapterContent)
  )
  const overlayChapterTitlesSignature = currentNovel
    ? currentNovel.chapters.map((chapter) => chapter.title).join('\u0000')
    : ''
  const routeState = (location.state as
    | { activateBossMode?: boolean; returnDirectoryId?: string }
    | null)
  const activeStealthOpacity = clampStealthOpacity(
    isStealthMode ? bossOpacity : opacity
  )
  const displayOpacity = isWebviewStealthMode
    ? bossMode.isConcealed
      ? Math.min(activeStealthOpacity, 0.04)
      : activeStealthOpacity
    : 1
  const shouldActivateBossMode = Boolean(routeState?.activateBossMode)
  const returnDirectoryId = routeState?.returnDirectoryId
  const contentStyle: CSSProperties = {
    maxWidth: `${pageWidth}%`,
    fontSize: `${fontSize}px`,
    fontFamily: resolveReaderFontFamily(fontFamily),
    lineHeight,
  }

const isCamouflageFeatureActive = isWebviewStealthMode && bossCamouflageEnabled
const showCamouflageWidget =
  isCamouflageFeatureActive &&
  (camouflageStage === 'collapsed' || camouflageStage === 'expanding')
const readerShellStyle = isCamouflageFeatureActive
  ? ({
      transformOrigin: buildCamouflageTransformOrigin(camouflageWidgetPosition),
    } as CSSProperties)
  : undefined
const camouflageWidgetStyle = buildCamouflageWidgetStyle(camouflageWidgetPosition)
const readerShellClassName = `${styles.readerShell} ${
  camouflageStage === 'collapsing' ? styles.readerShellCollapsing : ''
} ${camouflageStage === 'expanding' ? styles.readerShellExpanding : ''}`
const camouflageWidgetClassName = `${styles.camouflageWidget} ${
  camouflageStage === 'collapsed'
    ? styles.camouflageWidgetVisible
    : camouflageStage === 'expanding'
    ? styles.camouflageWidgetLeaving
    : ''
}`

  useClickOutside(bossPanelRef, isWebviewStealthMode && bossMode.isPanelOpen, () => {
    bossMode.closePanel()
  })
  useClickOutside(appearancePanelRef, showAppearancePanel, () => {
    setShowAppearancePanel(false)
  })

  // 把当前章节正文、字体和文字颜色同步到原生桌面浮窗，用于摸鱼模式渲染正文。
  const syncDesktopOverlay = async (nextOpacity = activeStealthOpacity) => {
    if (!useDesktopOverlay || !currentNovel) {
      return
    }

    const { red, green, blue } = parseHexColor(textColor)

    await UpdateDesktopReaderOverlay(
      overlayChapterMarkup,
      Math.round(fontSize),
      lineHeight,
      nextOpacity,
      red,
      green,
      blue
    )
  }

  // 同步浮窗顶部/底部控制区需要的章节列表、当前章节和透明度状态。
  const syncDesktopOverlayControls = async (nextOpacity = activeStealthOpacity) => {
    if (!useDesktopOverlay || !currentNovel) {
      return
    }

    if (currentNovel.chapters.length === 0) {
      return
    }

    const chapterTitles = currentNovel.chapters.map((chapter) => chapter.title)
    await UpdateDesktopReaderOverlayControls(
      JSON.stringify(chapterTitles),
      currentNovel.currentChapter,
      Number(currentNovel.readProgress || 0),
      nextOpacity,
      bossCamouflageEnabled
    )
  }

  // 从后端读取指定章节正文，并在内容更新后恢复到顶部或既有滚动位置。
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

  // 统一保存阅读进度，同时更新阅读页状态和书架展示所依赖的数据。
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

  // 执行章节切换或搜索跳转，并尽量保留章节内对应的滚动百分比。
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


const clearCamouflageTimers = () => {
  if (camouflageTimerRef.current) {
    window.clearTimeout(camouflageTimerRef.current)
    camouflageTimerRef.current = null
  }
}

const closeTransientPanels = () => {
  setShowSidebar(false)
  setShowSearch(false)
  setShowAppearancePanel(false)
  bossMode.closePanel()
}

// 鼠标移出阅读方块后，把整个摸鱼阅读框收纳为一个小挂件。
const startCamouflageCollapse = () => {
  if (!isCamouflageFeatureActive || camouflageStage !== 'expanded') {
    return
  }

  clearCamouflageTimers()
  closeTransientPanels()
  setCamouflageStage('collapsing')
  camouflageTimerRef.current = window.setTimeout(() => {
    bossMode.concealImmediately()
    setCamouflageStage('collapsed')
  }, CAMOUFLAGE_ANIMATION_MS)
}

// 挂件双击后恢复阅读框，章节、滚动位置和透明度都保持原样。
const restoreCamouflageReader = () => {
  if (!isCamouflageFeatureActive || camouflageStage !== 'collapsed') {
    return
  }

  if (isDraggingCamouflageWidget) {
    return
  }

  clearCamouflageTimers()
  setCamouflageStage('expanding')
  bossMode.revealImmediately()
  camouflageTimerRef.current = window.setTimeout(() => {
    setCamouflageStage('expanded')
  }, CAMOUFLAGE_ANIMATION_MS)
}

// 挂件支持拖拽，位置会持久化到设置里，方便下次继续使用。
const handleCamouflageWidgetPointerDown = (
  event: ReactPointerEvent<HTMLButtonElement>
) => {
  if (event.button !== 0) {
    return
  }

  setIsDraggingCamouflageWidget(true)

  const startX = event.clientX
  const startY = event.clientY
  const startPosition = camouflageWidgetPosition
  let latestPosition = startPosition
  let moved = false

  const cleanup = () => {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', finishDrag)
    window.removeEventListener('pointercancel', finishDrag)
    camouflageDragCleanupRef.current = null
    setIsDraggingCamouflageWidget(false)

    if (moved) {
      setBossCamouflageWidgetPosition(latestPosition)
    }
  }

  const handlePointerMove = (moveEvent: PointerEvent) => {
    const travelSize = getCamouflageTravelSize()
    const deltaX = (moveEvent.clientX - startX) / travelSize.x
    const deltaY = (moveEvent.clientY - startY) / travelSize.y

    latestPosition = normalizeCamouflageWidgetPosition({
      x: startPosition.x + deltaX,
      y: startPosition.y + deltaY,
    })
    moved =
      moved ||
      Math.abs(moveEvent.clientX - startX) > 3 ||
      Math.abs(moveEvent.clientY - startY) > 3
    setCamouflageWidgetPosition(latestPosition)
  }

  const finishDrag = () => {
    cleanup()
  }

  camouflageDragCleanupRef.current = cleanup
  event.preventDefault()
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', finishDrag)
  window.addEventListener('pointercancel', finishDrag)
}

const handleReaderShellMouseEnter = () => {
  if (isCamouflageFeatureActive && camouflageStage === 'collapsing') {
    clearCamouflageTimers()
    setCamouflageStage('expanded')
  }

  bossMode.handlePointerEnter()
  void OnMouseEnter()
}

const handleReaderShellMouseLeave = () => {
  void OnMouseLeave()

  if (isCamouflageFeatureActive) {
    startCamouflageCollapse()
    return
  }

  bossMode.handlePointerLeave()
}

const handleToggleCamouflage = () => {
  const nextEnabled = !bossCamouflageEnabled
  setBossCamouflageEnabled(nextEnabled)

  if (!nextEnabled) {
    clearCamouflageTimers()
    bossMode.revealImmediately()
    setCamouflageStage('expanded')
    setIsDraggingCamouflageWidget(false)
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

  // 在普通阅读和摸鱼模式之间切换，同时处理桌面浮窗与 WebView 内透明阅读两套实现。
  const handleToggleStealthMode = async () => {
    const nextStealthMode = !isStealthMode
    const rememberedBossOpacity = getPersistedBossOpacity(useSettingsStore.getState().bossOpacity)

    try {
      if (useDesktopOverlay) {
        if (nextStealthMode) {
          const { red, green, blue } = parseHexColor(textColor)
          setBossOpacity(rememberedBossOpacity)

          await ShowDesktopReaderOverlay(
            overlayChapterMarkup,
            Math.round(fontSize),
            lineHeight,
            rememberedBossOpacity,
            red,
            green,
            blue
          )
          await syncDesktopOverlayControls(rememberedBossOpacity)
          setStealthMode(true)
          setOpacity(rememberedBossOpacity)
          setShowSearch(false)
          setShowSidebar(false)
          bossMode.closePanel()
        } else {
          setBossOpacity(useWindowStore.getState().opacity)
          await HideDesktopReaderOverlay()
          setStealthMode(false)
          setOpacity(1)
          bossMode.closePanel()
        }

        return
      }

      if (nextStealthMode) {
        setBossOpacity(rememberedBossOpacity)
        await EnableStealthMode()
        await SetOpacity(rememberedBossOpacity)
        setStealthMode(true)
        setOpacity(rememberedBossOpacity)
        bossMode.revealImmediately()
      } else {
        setBossOpacity(useWindowStore.getState().opacity)
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
        setBossOpacity(useWindowStore.getState().opacity)
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
  setCamouflageWidgetPosition(
    normalizeCamouflageWidgetPosition(bossCamouflageWidgetPosition)
  )
}, [bossCamouflageWidgetPosition.x, bossCamouflageWidgetPosition.y])

useEffect(() => {
  if (isCamouflageFeatureActive) {
    return
  }

  clearCamouflageTimers()
  if (camouflageDragCleanupRef.current) {
    camouflageDragCleanupRef.current()
  }
  setIsDraggingCamouflageWidget(false)

  if (camouflageStage !== 'expanded') {
    bossMode.revealImmediately()
    setCamouflageStage('expanded')
  }
}, [camouflageStage, isCamouflageFeatureActive])

useEffect(
  () => () => {
    clearCamouflageTimers()
    if (camouflageDragCleanupRef.current) {
      camouflageDragCleanupRef.current()
    }
  },
  []
)

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
    setReaderStealthRoot(isWebviewStealthMode)

    return () => {
      setReaderStealthRoot(false)
    }
  }, [isWebviewStealthMode])

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
    if (!showAppearancePanel) {
      return
    }

    if (isWebviewStealthMode || !bossMode.isChromeVisible) {
      setShowAppearancePanel(false)
    }
  }, [bossMode.isChromeVisible, isWebviewStealthMode, showAppearancePanel])

  useEffect(() => {
    if (!useDesktopOverlay || !isStealthMode || !currentNovel) {
      return
    }

    void syncDesktopOverlay()
  }, [
    fontSize,
    currentNovel?.filePath,
    lineHeight,
    overlayChapterMarkup,
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
    currentNovel?.currentChapter,
    currentNovel?.filePath,
    currentNovel?.readProgress,
    bossCamouflageEnabled,
    overlayChapterTitlesSignature,
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

        setBossOpacity(useWindowStore.getState().opacity)
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
            } else if (action.type === 'camouflage') {
              setBossCamouflageEnabled(Boolean(action.value))
            } else if (action.type === 'close') {
              setBossOpacity(useWindowStore.getState().opacity)
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
    if (!hasWailsRuntimeEvents()) {
      return
    }

    const offStealthMode = EventsOn('window:stealthMode', (enabled: boolean) => {
      setStealthMode(Boolean(enabled))
    })
    const offOpacity = EventsOn('window:opacity', (nextOpacity: number) => {
      const normalizedOpacity = clampStealthOpacity(Number(nextOpacity))
      setOpacity(Number(nextOpacity))
      if (useWindowStore.getState().isStealthMode && Number(nextOpacity) < 1) {
        setBossOpacity(normalizedOpacity)
      }
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
        setShowAppearancePanel(false)

        if (isCamouflageFeatureActive) {
          startCamouflageCollapse()
          return
        }

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
    className={`${styles.reader} ${isWebviewStealthMode ? styles.stealthMode : ''}`}
    style={{
      backgroundColor: isWebviewStealthMode ? 'transparent' : backgroundColor,
      color: textColor,
    }}
  >
    {(!isCamouflageFeatureActive || camouflageStage !== 'collapsed') && (
      <div
        className={readerShellClassName}
        style={readerShellStyle}
        onMouseEnter={handleReaderShellMouseEnter}
        onMouseLeave={handleReaderShellMouseLeave}
        onMouseMove={bossMode.bumpPanelTimer}
        onContextMenu={bossMode.handleContextMenu}
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
            {!isWebviewStealthMode && (
              <div ref={appearancePanelRef} className={styles.toolbarPopover}>
                <button
                  type="button"
                  onClick={() => setShowAppearancePanel((value) => !value)}
                  className={`${styles.toolbarButton} ${
                    showAppearancePanel ? styles.active : ''
                  }`}
                  title="阅读外观"
                >
                  外观
                </button>
                {showAppearancePanel && bossMode.isChromeVisible && (
                  <div className={styles.appearancePanel}>
                    <div className={styles.appearancePanelHeader}>
                      <span>阅读外观</span>
                      <button
                        type="button"
                        onClick={() => setShowAppearancePanel(false)}
                        className={styles.panelCloseButton}
                      >
                        收起
                      </button>
                    </div>
                    <div className={styles.appearancePanelBody}>
                      <ReadingAppearanceControls
                        variant="panel"
                        fontSize={fontSize}
                        fontFamily={fontFamily}
                        lineHeight={lineHeight}
                        pageWidth={pageWidth}
                        backgroundColor={backgroundColor}
                        textColor={textColor}
                        onFontSizeChange={setFontSize}
                        onFontFamilyChange={setFontFamily}
                        onLineHeightChange={setLineHeight}
                        onPageWidthChange={setPageWidth}
                        onBackgroundColorChange={setBackgroundColor}
                        onTextColorChange={setTextColor}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
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
            {isWebviewStealthMode && (
              <button
                type="button"
                onClick={handleToggleCamouflage}
                className={`${styles.toolbarButton} ${
                  bossCamouflageEnabled ? styles.active : ''
                }`}
                title="收纳伪装"
              >
                收纳伪装
              </button>
            )}
            {isWebviewStealthMode && (
              <input
                type="range"
                min="0.02"
                max="1"
                step="0.02"
                value={opacityToTransparencySliderValue(activeStealthOpacity)}
                onChange={(event) =>
                  handleOpacityChange(transparencySliderValueToOpacity(Number(event.target.value)))
                }
                className={styles.opacitySlider}
                title="文字透明度"
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
          style={contentStyle}
        >
          <div className={styles.contentBody} style={{ opacity: displayOpacity }}>
            {currentChapter && <h2 className={styles.chapterTitle}>{currentChapter.title}</h2>}
            {isLoadingChapter ? (
              <div className={styles.loading}>章节内容加载中...</div>
            ) : (
              <div
                className={`${styles.text} ${isEpubChapterContent ? styles.epubText : ''}`}
                dangerouslySetInnerHTML={{
                  __html: chapterHtml,
                }}
              />
            )}
          </div>
        </div>

        {isWebviewStealthMode && bossMode.isConcealed && (
          <div className={styles.concealedHint}>悬停唤出阅读内容</div>
        )}

        {isWebviewStealthMode && bossMode.isPanelOpen && (
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
                文字透明度 {opacityToTransparencySliderValue(bossOpacity).toFixed(2)}
              </span>
              <input
                type="range"
                min="0.02"
                max="1"
                step="0.02"
                value={opacityToTransparencySliderValue(bossOpacity)}
                onChange={(event) =>
                  handleOpacityChange(transparencySliderValueToOpacity(Number(event.target.value)))
                }
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
                onClick={handleToggleCamouflage}
              >
                {bossCamouflageEnabled ? '关闭收纳伪装' : '开启收纳伪装'}
              </button>
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
    )}

    {showCamouflageWidget && (
      <CamouflagePendant
        className={camouflageWidgetClassName}
        style={camouflageWidgetStyle}
        title="伪装中"
        subtitle={isDraggingCamouflageWidget ? '拖动挂件位置' : '双击展开阅读框'}
        dragging={isDraggingCamouflageWidget}
        onDoubleClick={restoreCamouflageReader}
        onPointerDown={handleCamouflageWidgetPointerDown}
      />
    )}
  </div>
)

}
