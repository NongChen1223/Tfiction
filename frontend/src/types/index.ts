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

// BookFile 目录内的单个文件
export interface BookFile {
  id: string
  title: string
  filePath: string // 文件路径
  format: string // 文件格式
  fileSize: number // 文件大小（字节）
  progress: number // 阅读进度 0-100
  currentPage?: number // 当前页码
  lastReadTime?: number // 最后阅读时间戳
  order: number // 排序序号
}

// Book 书籍展示类型（用于书架展示）
// 支持两种模式：单文件和目录
export interface Book {
  id: string
  title: string
  author: string
  cover?: string // 封面图片路径
  type: 'novel' | 'manga'
  category: string // 分类标签
  lastReadTime?: number // 最后阅读时间戳
  createdAt: number // 创建时间

  // 区分单文件还是目录
  isDirectory: boolean

  // === 单文件模式 (isDirectory = false) ===
  filePath?: string // 文件路径
  format?: string // 文件格式
  fileSize?: number // 文件大小
  progress?: number // 阅读进度 0-100

  // === 目录模式 (isDirectory = true) ===
  files?: BookFile[] // 包含的文件数组
  totalFiles?: number // 文件总数
  lastReadFileId?: string // 最后阅读的文件ID
}

// ViewMode 视图模式类型
export type ViewMode = 'grid' | 'list'

// SortMode 排序模式类型
export type SortMode = 'time' | 'size' | 'name'
