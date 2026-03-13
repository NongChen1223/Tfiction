import type { Book, Chapter, Novel } from '@/types'
import { models } from '@/wailsjs/go/models'

const DEFAULT_AUTHOR = '未知作者'

export function normalizeNovel(source: models.Novel | Novel): Novel {
  const sourceChapters = 'chapters' in source ? source.chapters : []

  return {
    title: source.title,
    author: ('author' in source && source.author) || DEFAULT_AUTHOR,
    filePath: 'filePath' in source ? source.filePath : source.file_path,
    cover: source.cover,
    format: source.format,
    size: source.size,
    content: source.content,
    chapters: sourceChapters.map(normalizeChapter),
    currentChapter:
      'currentChapter' in source ? source.currentChapter : source.current_chapter,
    readProgress:
      'readProgress' in source ? source.readProgress : source.read_progress,
    lastReadTime:
      'lastReadTime' in source ? source.lastReadTime : source.last_read_time,
  }
}

export function normalizeChapter(source: models.Chapter | Chapter): Chapter {
  return {
    index: source.index,
    title: source.title,
    startPos: 'startPos' in source ? source.startPos : source.start_pos,
    endPos: 'endPos' in source ? source.endPos : source.end_pos,
    wordCount: 'wordCount' in source ? source.wordCount : source.word_count,
  }
}

export function mapNovelToBook(novel: Novel, existingBook?: Book): Book {
  return {
    id: novel.filePath,
    title: novel.title,
    author: novel.author || existingBook?.author || DEFAULT_AUTHOR,
    type: 'novel',
    category: formatBookCategory(novel.format),
    isDirectory: false,
    cover: novel.cover || existingBook?.cover,
    filePath: novel.filePath,
    format: novel.format.replace(/^\./, ''),
    fileSize: novel.size,
    progress: clampProgress(novel.readProgress),
    lastReadTime: novel.lastReadTime || Date.now(),
    createdAt: existingBook?.createdAt || Date.now(),
  }
}

export function formatBookCategory(format: string) {
  return format.replace(/^\./, '').toUpperCase() || 'TXT'
}

export function resolveReaderFontFamily(fontFamily: string) {
  switch (fontFamily) {
    case 'serif':
      return 'var(--font-serif)'
    case 'mono':
      return 'var(--font-mono)'
    case 'sans':
    case 'system':
    default:
      return 'var(--font-sans)'
  }
}

export function buildHighlightedHtml(content: string, keyword: string) {
  const safeKeyword = keyword.trim()
  const paragraphSource = content.trim() ? content : '暂无内容'
  const paragraphs = paragraphSource.split(/\n{2,}/)

  return paragraphs
    .map((paragraph) => {
      const escapedParagraph = escapeHtml(paragraph).replace(/\n/g, '<br />')
      if (!safeKeyword) {
        return `<p>${escapedParagraph}</p>`
      }

      const regex = new RegExp(`(${escapeRegExp(escapeHtml(safeKeyword))})`, 'gi')
      return `<p>${escapedParagraph.replace(regex, '<mark>$1</mark>')}</p>`
    })
    .join('')
}

export function findChapterIndexByPosition(chapters: Chapter[], position: number) {
  const chapterIndex = chapters.findIndex(
    (chapter) => position >= chapter.startPos && position < chapter.endPos
  )

  return chapterIndex >= 0 ? chapterIndex : 0
}

export function calculateProgressFromPosition(
  novel: Novel,
  chapterIndex: number,
  chapterScrollProgress: number
) {
  const chapter = novel.chapters[chapterIndex]
  if (!chapter || novel.content.length === 0) {
    return 0
  }

  const normalizedChapterProgress = Math.max(0, Math.min(1, chapterScrollProgress))
  const chapterLength = Math.max(chapter.endPos - chapter.startPos, 1)
  const absolutePosition =
    chapter.startPos + Math.round(chapterLength * normalizedChapterProgress)

  return clampProgress((absolutePosition / Math.max(novel.content.length, 1)) * 100)
}

function clampProgress(progress: number) {
  return Math.max(0, Math.min(100, Number(progress || 0)))
}

function escapeHtml(content: string) {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeRegExp(content: string) {
  return content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
