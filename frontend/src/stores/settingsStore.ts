import { create } from 'zustand'
import type { ReadingSettings } from '@/types'

interface SettingsStore extends ReadingSettings {
  // 操作方法
  setFontSize: (size: number) => void
  setFontFamily: (family: string) => void
  setLineHeight: (height: number) => void
  setBackgroundColor: (color: string) => void
  setTextColor: (color: string) => void
  setPageWidth: (width: number) => void
  setTheme: (theme: 'light' | 'dark' | 'sepia') => void
  resetSettings: () => void
}

// 默认设置
const defaultSettings: ReadingSettings = {
  fontSize: 16,
  fontFamily: 'system-ui',
  lineHeight: 1.8,
  backgroundColor: '#ffffff',
  textColor: '#333333',
  pageWidth: 800,
  theme: 'light',
}

/**
 * 阅读设置状态管理
 * 管理字体、颜色、主题等阅读相关设置
 */
export const useSettingsStore = create<SettingsStore>((set) => ({
  // 初始状态
  ...defaultSettings,

  // 设置字体大小
  setFontSize: (size) => {
    set({ fontSize: Math.max(12, Math.min(32, size)) })
  },

  // 设置字体
  setFontFamily: (family) => {
    set({ fontFamily: family })
  },

  // 设置行高
  setLineHeight: (height) => {
    set({ lineHeight: Math.max(1.0, Math.min(3.0, height)) })
  },

  // 设置背景颜色
  setBackgroundColor: (color) => {
    set({ backgroundColor: color })
  },

  // 设置文字颜色
  setTextColor: (color) => {
    set({ textColor: color })
  },

  // 设置页面宽度
  setPageWidth: (width) => {
    set({ pageWidth: Math.max(600, Math.min(1200, width)) })
  },

  // 设置主题
  setTheme: (theme) => {
    let backgroundColor = '#ffffff'
    let textColor = '#333333'

    switch (theme) {
      case 'dark':
        backgroundColor = '#1a1a1a'
        textColor = '#e0e0e0'
        break
      case 'sepia':
        backgroundColor = '#f4ecd8'
        textColor = '#5c4b37'
        break
      default:
        backgroundColor = '#ffffff'
        textColor = '#333333'
    }

    set({ theme, backgroundColor, textColor })
  },

  // 重置设置
  resetSettings: () => {
    set(defaultSettings)
  },
}))
