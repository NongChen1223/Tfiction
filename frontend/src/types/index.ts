// Novel 小说类型
export interface Novel {
  title: string
  author: string
  filePath: string
  format: string
  size: number
  content: string
  chapters: Chapter[]
  currentChapter: number
  readProgress: number
  lastReadTime: number
}

// Chapter 章节类型
export interface Chapter {
  index: number
  title: string
  startPos: number
  endPos: number
  wordCount: number
}

// SearchResult 搜索结果类型
export interface SearchResult {
  position: number
  line: number
  context: string
  keyword: string
}

// ReadingSettings 阅读设置类型
export interface ReadingSettings {
  fontSize: number
  fontFamily: string
  lineHeight: number
  backgroundColor: string
  textColor: string
  pageWidth: number
  theme: 'light' | 'dark' | 'sepia'
}

// AppConfig 应用配置类型
export interface AppConfig {
  environment: 'local' | 'test' | 'prod'
  appName: string
  version: string
  dataDir: string
}

// WindowState 窗口状态类型
export interface WindowState {
  isAlwaysOnTop: boolean
  isStealthMode: boolean
  opacity: number
  isMouseInWindow: boolean
}

// Book 书籍展示类型（用于书架展示）
export interface Book {
  id: string
  title: string
  author: string
  cover?: string // 封面图片路径
  type: 'novel' | 'manga'
  progress: number // 阅读进度 0-100
  category: string // 分类标签
  lastReadTime?: number // 最后阅读时间戳
  filePath: string
  format: string
}

// ViewMode 视图模式类型
export type ViewMode = 'grid' | 'list'
