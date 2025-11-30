import { create } from 'zustand'
import type { Novel } from '@/types'

interface NovelState {
  // 状态
  currentNovel: Novel | null
  novels: Novel[]
  isLoading: boolean

  // 操作方法
  setCurrentNovel: (novel: Novel | null) => void
  addNovel: (novel: Novel) => void
  removeNovel: (filePath: string) => void
  updateReadProgress: (filePath: string, progress: number) => void
  setCurrentChapter: (chapterIndex: number) => void
}

/**
 * 小说状态管理
 * 管理当前打开的小说、小说列表、阅读进度等
 */
export const useNovelStore = create<NovelState>((set) => ({
  // 初始状态
  currentNovel: null,
  novels: [],
  isLoading: false,

  // 设置当前小说
  setCurrentNovel: (novel) => {
    set({ currentNovel: novel })
  },

  // 添加小说到列表
  addNovel: (novel) => {
    set((state) => {
      const exists = state.novels.find((n) => n.filePath === novel.filePath)
      if (exists) {
        return state
      }
      return {
        novels: [...state.novels, novel],
      }
    })
  },

  // 从列表移除小说
  removeNovel: (filePath) => {
    set((state) => ({
      novels: state.novels.filter((n) => n.filePath !== filePath),
      currentNovel:
        state.currentNovel?.filePath === filePath ? null : state.currentNovel,
    }))
  },

  // 更新阅读进度
  updateReadProgress: (filePath, progress) => {
    set((state) => ({
      novels: state.novels.map((n) =>
        n.filePath === filePath ? { ...n, readProgress: progress } : n
      ),
      currentNovel:
        state.currentNovel?.filePath === filePath
          ? { ...state.currentNovel, readProgress: progress }
          : state.currentNovel,
    }))
  },

  // 设置当前章节
  setCurrentChapter: (chapterIndex) => {
    set((state) => {
      if (!state.currentNovel) return state
      return {
        currentNovel: {
          ...state.currentNovel,
          currentChapter: chapterIndex,
        },
      }
    })
  },
}))
