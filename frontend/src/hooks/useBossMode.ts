import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'

interface BossModeOptions {
  isStealthMode: boolean
  bossModeType: 'basic' | 'full'
  revealDelay: number
  hideDelay: number
}

interface PanelPosition {
  x: number
  y: number
}

/**
 * 管理摸鱼模式下控制条、悬浮面板和显隐延时。
 * 这里只负责交互状态，不直接处理阅读内容或原生窗口逻辑。
 */
export function useBossMode({
  isStealthMode,
  bossModeType,
  revealDelay,
  hideDelay,
}: BossModeOptions) {
  const revealTimerRef = useRef<number | null>(null)
  const concealTimerRef = useRef<number | null>(null)
  const panelTimerRef = useRef<number | null>(null)

  const [isHovered, setIsHovered] = useState(false)
  const [isForceVisible, setIsForceVisible] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [panelPosition, setPanelPosition] = useState<PanelPosition>({ x: 0, y: 0 })

  const isConcealed =
    isStealthMode &&
    bossModeType === 'full' &&
    !isHovered &&
    !isPanelOpen &&
    !isForceVisible

  const isChromeVisible = !isStealthMode || isHovered || isPanelOpen || isForceVisible

  const clearRevealTimer = () => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current)
      revealTimerRef.current = null
    }
  }

  const clearConcealTimer = () => {
    if (concealTimerRef.current) {
      window.clearTimeout(concealTimerRef.current)
      concealTimerRef.current = null
    }
  }

  const clearPanelTimer = () => {
    if (panelTimerRef.current) {
      window.clearTimeout(panelTimerRef.current)
      panelTimerRef.current = null
    }
  }

  const schedulePanelAutoHide = () => {
    clearPanelTimer()
    panelTimerRef.current = window.setTimeout(() => {
      setIsPanelOpen(false)
    }, 5000)
  }

  const reveal = () => {
    clearConcealTimer()
    clearRevealTimer()
    revealTimerRef.current = window.setTimeout(() => {
      setIsHovered(true)
    }, Math.max(0, revealDelay))
  }

  const conceal = () => {
    clearRevealTimer()
    clearConcealTimer()
    concealTimerRef.current = window.setTimeout(() => {
      setIsHovered(false)
      setIsForceVisible(false)
    }, Math.max(0, hideDelay))
  }

  const handlers = useMemo(
    () => ({
      handlePointerEnter() {
        if (!isStealthMode) {
          return
        }
        reveal()
      },
      handlePointerLeave() {
        if (!isStealthMode) {
          return
        }
        conceal()
        schedulePanelAutoHide()
      },
      handleContextMenu(event: ReactMouseEvent<HTMLElement>) {
        if (!isStealthMode) {
          return
        }
        event.preventDefault()
        setPanelPosition({ x: event.clientX, y: event.clientY })
        setIsPanelOpen(true)
        setIsHovered(true)
        schedulePanelAutoHide()
      },
      pinVisible(value: boolean) {
        setIsForceVisible(value)
        setIsHovered(value)
        if (!value) {
          conceal()
        }
      },
      concealImmediately() {
        clearRevealTimer()
        clearConcealTimer()
        setIsHovered(false)
        setIsForceVisible(false)
        setIsPanelOpen(false)
      },
      revealImmediately() {
        clearRevealTimer()
        clearConcealTimer()
        setIsHovered(true)
      },
      openPanel() {
        setIsPanelOpen(true)
        setIsHovered(true)
        schedulePanelAutoHide()
      },
      closePanel() {
        setIsPanelOpen(false)
        clearPanelTimer()
      },
      bumpPanelTimer() {
        if (isPanelOpen) {
          schedulePanelAutoHide()
        }
      },
    }),
    [hideDelay, isPanelOpen, isStealthMode, revealDelay]
  )

  useEffect(() => {
    if (!isStealthMode) {
      clearRevealTimer()
      clearConcealTimer()
      clearPanelTimer()
      setIsHovered(false)
      setIsForceVisible(false)
      setIsPanelOpen(false)
      return
    }

    setIsHovered(true)
  }, [isStealthMode])

  useEffect(() => {
    if (bossModeType === 'basic') {
      setIsHovered(true)
    }
  }, [bossModeType])

  useEffect(
    () => () => {
      clearRevealTimer()
      clearConcealTimer()
      clearPanelTimer()
    },
    []
  )

  return {
    isConcealed,
    isChromeVisible,
    isPanelOpen,
    isForceVisible,
    panelPosition,
    ...handlers,
  }
}
