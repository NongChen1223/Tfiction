import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'sepia'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

/**
 * 主题状态管理
 * 管理应用的主题模式（白天/夜间/护眼）
 * 使用 localStorage 持久化主题设置
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark', // 默认使用夜间模式

      setTheme: (theme) => {
        set({ theme })
        // 更新 HTML 标签的 data-theme 属性
        document.documentElement.setAttribute('data-theme', theme)
      },

      toggleTheme: () => {
        const currentTheme = get().theme
        const themeOrder: Theme[] = ['light', 'dark', 'sepia']
        const currentIndex = themeOrder.indexOf(currentTheme)
        const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length]
        get().setTheme(nextTheme)
      },
    }),
    {
      name: 'tfiction-theme',
      onRehydrateStorage: () => (state) => {
        // 恢复主题时，同步更新 HTML 属性
        if (state) {
          document.documentElement.setAttribute('data-theme', state.theme)
        }
      },
    }
  )
)

// 初始化主题（在应用启动时调用）
export function initTheme() {
  const theme = useThemeStore.getState().theme
  document.documentElement.setAttribute('data-theme', theme)
}
