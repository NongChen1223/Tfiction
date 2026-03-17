import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReadingSettings, ShortcutAction, ShortcutMap } from '@/types'
import { DEFAULT_SHORTCUTS } from '@/utils/shortcuts'

const MIN_PAGE_WIDTH_PERCENT = 55
const MAX_PAGE_WIDTH_PERCENT = 100
const LEGACY_MIN_PAGE_WIDTH_PX = 400
const LEGACY_MAX_PAGE_WIDTH_PX = 1200

export function normalizePageWidth(value: number) {
  const numericValue = Number(value || 0)

  // 兼容旧版本保存的 px 值，按原范围映射到百分比。
  if (numericValue > MAX_PAGE_WIDTH_PERCENT) {
    const legacyRatio =
      (Math.min(Math.max(numericValue, LEGACY_MIN_PAGE_WIDTH_PX), LEGACY_MAX_PAGE_WIDTH_PX) -
        LEGACY_MIN_PAGE_WIDTH_PX) /
      (LEGACY_MAX_PAGE_WIDTH_PX - LEGACY_MIN_PAGE_WIDTH_PX)

    return Math.round(
      MIN_PAGE_WIDTH_PERCENT +
        legacyRatio * (MAX_PAGE_WIDTH_PERCENT - MIN_PAGE_WIDTH_PERCENT)
    )
  }

  return Math.min(
    MAX_PAGE_WIDTH_PERCENT,
    Math.max(MIN_PAGE_WIDTH_PERCENT, Math.round(numericValue))
  )
}

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
  pageWidth: 78,
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
      setPageWidth: (pageWidth) => set({ pageWidth: normalizePageWidth(pageWidth) }),
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
      merge: (persistedState, currentState) => {
        const typedPersistedState = (persistedState || {}) as Partial<SettingsState>

        return {
          ...currentState,
          ...typedPersistedState,
          pageWidth: normalizePageWidth(
            typedPersistedState.pageWidth ?? currentState.pageWidth
          ),
        }
      },
    }
  )
)
