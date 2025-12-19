import { useEffect } from 'react'

/**
 * 修复 Wails 窗口拖拽失效的 Hook
 *
 * 问题描述：
 * - 在 Wails 应用中，当窗口被隐藏（最小化、切换到其他应用等）后再显示
 * - CSS 的 -webkit-app-region: drag 属性会失效
 * - 导致用户无法拖动窗口
 *
 * 解决方案：
 * - 监听窗口焦点事件（focus）
 * - 监听文档可见性变化（visibilitychange）
 * - 在窗口重新获得焦点或变为可见时，强制刷新拖拽区域的 CSS
 *
 * 工作原理：
 * 1. 通过移除并重新添加 className，触发浏览器重新计算样式
 * 2. 使用 requestAnimationFrame 确保样式更新在下一帧生效
 * 3. 延迟执行以避免过于频繁的刷新
 *
 * @example
 * ```tsx
 * function App() {
 *   useFixWailsDrag()
 *   return <div>...</div>
 * }
 * ```
 */
export function useFixWailsDrag() {
  useEffect(() => {
    let rafId: number | null = null
    let timeoutId: number | null = null

    /**
     * 刷新拖拽区域样式
     * 通过强制重新渲染来修复 app-region 失效问题
     */
    const refreshDraggableRegions = () => {
      // 取消之前的请求
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }

      rafId = requestAnimationFrame(() => {
        // 方法 1: 刷新所有带 header class 的元素（拖拽区域通常在 header）
        const headers = document.querySelectorAll('[class*="header"]')
        headers.forEach((element) => {
          if (element instanceof HTMLElement) {
            const className = element.className
            element.className = ''
            // 强制浏览器重新计算样式
            void element.offsetHeight
            element.className = className
          }
        })

        // 方法 2: 刷新所有带 data-wails-drag 属性的元素
        const draggableElements = document.querySelectorAll('[data-wails-drag="true"]')
        draggableElements.forEach((element) => {
          if (element instanceof HTMLElement) {
            const className = element.className
            element.className = ''
            void element.offsetHeight
            element.className = className
          }
        })

        rafId = null
      })
    }

    /**
     * 延迟刷新（避免过于频繁）
     */
    const debouncedRefresh = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
      timeoutId = window.setTimeout(refreshDraggableRegions, 50)
    }

    // 监听窗口焦点事件
    const handleFocus = () => {
      debouncedRefresh()
    }

    // 监听可见性变化
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 窗口从隐藏变为可见
        debouncedRefresh()
      }
    }

    // 监听窗口激活（macOS 特有）
    const handleWindowActivate = () => {
      debouncedRefresh()
    }

    // 添加事件监听
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('activate', handleWindowActivate)

    // 首次加载时也刷新一次
    refreshDraggableRegions()

    // 清理
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('activate', handleWindowActivate)

      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
    }
  }, [])
}
