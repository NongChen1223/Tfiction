import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReadingSettings, ShortcutAction, ShortcutMap } from '@/types'
import { DEFAULT_SHORTCUTS } from '@/utils/shortcuts'

interface SettingsState extends ReadingSettings {
  bossMode: boolean
  bossOpacity: number
  keyboardShortcuts: ShortcutMap
  setFontSize: (size: number) => void
  setFontFamily: (family: string) => void
  setLineHeight: (height: number) => void
  setBackgroundColor: (color: string) => void
  setTextColor: (color: string) => void
  setPageWidth: (width: number) => void
  setTheme: (theme: 'light' | 'dark' | 'sepia') => void
  setBossModeType: (bossModeType: 'basic' | 'full') => void
  setBossRevealDelay: (delay: number) => void
  setBossHideDelay: (delay: number) => void
  setBossMode: (enabled: boolean) => void
  setBossOpacity: (opacity: number) => void
  setKeyboardShortcut: (action: ShortcutAction, shortcut: string) => void
  resetKeyboardShortcuts: () => void
  resetSettings: () => void
}

const defaultSettings: ReadingSettings = {
  fontSize: 18,
  fontFamily: 'system',
  lineHeight: 1.8,
  backgroundColor: '#ffffff',
  textColor: '#333333',
  pageWidth: 800,
  theme: 'light',
  bossModeType: 'basic',
  bossRevealDelay: 80,
  bossHideDelay: 260,
}

const defaultBossSettings = {
  bossMode: false,
  bossOpacity: 0.3,
}

/**
 * 阅读设置状态管理
 * 管理字体、行高、页宽等阅读相关设置
 * 使用 localStorage 持久化设置
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      ...defaultBossSettings,
      keyboardShortcuts: DEFAULT_SHORTCUTS,

      setFontSize: (fontSize) => set({ fontSize }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
      setTextColor: (textColor) => set({ textColor }),
      setPageWidth: (pageWidth) => set({ pageWidth }),
      setTheme: (theme) => set({ theme }),
      setBossModeType: (bossModeType) => set({ bossModeType }),
      setBossRevealDelay: (bossRevealDelay) => set({ bossRevealDelay }),
      setBossHideDelay: (bossHideDelay) => set({ bossHideDelay }),
      setBossMode: (bossMode) => set({ bossMode }),
      setBossOpacity: (bossOpacity) => set({ bossOpacity }),
      setKeyboardShortcut: (action, shortcut) =>
        set((state) => ({
          keyboardShortcuts: {
            ...state.keyboardShortcuts,
            [action]: shortcut,
          },
        })),
      resetKeyboardShortcuts: () => set({ keyboardShortcuts: DEFAULT_SHORTCUTS }),

      resetSettings: () =>
        set({
          ...defaultSettings,
          ...defaultBossSettings,
          keyboardShortcuts: DEFAULT_SHORTCUTS,
        }),
    }),
    {
      name: 'tfiction-settings',
    }
  )
)
