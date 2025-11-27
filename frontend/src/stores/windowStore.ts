import { create } from 'zustand'
import { WindowState } from '@types/index'

interface WindowStore extends WindowState {
  // 操作方法
  setAlwaysOnTop: (alwaysOnTop: boolean) => void
  setStealthMode: (stealthMode: boolean) => void
  setOpacity: (opacity: number) => void
  setMouseInWindow: (isIn: boolean) => void
  toggleStealthMode: () => void
}

/**
 * 窗口状态管理
 * 管理窗口置顶、摸鱼模式、透明度等状态
 */
export const useWindowStore = create<WindowStore>((set) => ({
  // 初始状态
  isAlwaysOnTop: false,
  isStealthMode: false,
  opacity: 1.0,
  isMouseInWindow: true,

  // 设置窗口置顶
  setAlwaysOnTop: (alwaysOnTop) => {
    set({ isAlwaysOnTop: alwaysOnTop })
  },

  // 设置摸鱼模式
  setStealthMode: (stealthMode) => {
    set({
      isStealthMode: stealthMode,
      opacity: stealthMode ? 0.3 : 1.0,
      isAlwaysOnTop: stealthMode,
    })
  },

  // 设置透明度
  setOpacity: (opacity) => {
    const clampedOpacity = Math.max(0, Math.min(1, opacity))
    set({ opacity: clampedOpacity })
  },

  // 设置鼠标是否在窗口内
  setMouseInWindow: (isIn) => {
    set({ isMouseInWindow: isIn })
  },

  // 切换摸鱼模式
  toggleStealthMode: () => {
    set((state) => ({
      isStealthMode: !state.isStealthMode,
      opacity: !state.isStealthMode ? 0.3 : 1.0,
      isAlwaysOnTop: !state.isStealthMode,
    }))
  },
}))
