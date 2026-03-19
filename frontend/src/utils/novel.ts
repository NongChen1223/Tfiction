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

export function isRichChapterContent(content: string) {
  const trimmedContent = content.trim()
  return trimmedContent.includes('data-chapter-rich="true"')
}

interface DesktopOverlayChapterMarkup {
  title?: string | null
  content: string
  contentIsHtml?: boolean
}

export function buildDesktopOverlayMarkup(
  title: string | null | undefined,
  content: string,
  contentIsHtml = false
) {
  return buildDesktopOverlayChaptersMarkup([
    {
      title,
      content,
      contentIsHtml,
    },
  ])
}

export function buildDesktopOverlayChaptersMarkup(chapters: DesktopOverlayChapterMarkup[]) {
  const safeChapters = chapters.length > 0 ? chapters : [{ title: null, content: '', contentIsHtml: false }]
  const articleMarkup = safeChapters
    .map((chapter, index) => buildDesktopOverlayChapterMarkup(chapter, index))
    .join('')

  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8" />',
    '<style>',
    'body { margin: 0; padding: 0; }',
    'article { margin: 0; padding: 0; }',
    'p, div, section, blockquote, pre, ul, ol, figure { margin: 0 0 1em; }',
    '.overlay-chapter + .overlay-chapter { margin-top: 2.8em; padding-top: 2.2em; border-top: 1px solid rgba(255, 255, 255, 0.18); }',
    '.overlay-chapter-title { margin: 0 0 1.2em; }',
    'img { display: block; max-width: 100%; height: auto; margin: 0 auto; }',
    'figcaption { margin-top: 0.4em; }',
    '</style>',
    '</head>',
    '<body>',
    `<article>${articleMarkup}</article>`,
    '</body>',
    '</html>',
  ].join('')
}

export function stripHtmlToText(content: string) {
  if (!content.includes('<')) {
    return content
  }

  if (typeof DOMParser !== 'undefined') {
    const parsed = new DOMParser().parseFromString(content, 'text/html')
    return parsed.body.textContent?.replace(/\s+\n/g, '\n').trim() || ''
  }

  return content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
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

function buildDesktopOverlayChapterMarkup(
  chapter: DesktopOverlayChapterMarkup,
  index: number
) {
  const safeTitle = chapter.title?.trim()
  const contentMarkup = chapter.contentIsHtml
    ? normalizeDesktopOverlayHtml(chapter.content)
    : buildDesktopOverlayPlainTextMarkup(chapter.content)

  const titleMarkup = safeTitle
    ? `<p class="overlay-chapter-title"><strong>${escapeHtml(safeTitle)}</strong></p>`
    : ''
  const bodyMarkup = contentMarkup || '<p>暂无内容</p>'

  return `<section class="overlay-chapter" data-overlay-chapter-index="${index}">${titleMarkup}${bodyMarkup}</section>`
}

function buildDesktopOverlayPlainTextMarkup(content: string) {
  const paragraphSource = content.trim() ? content : '暂无内容'
  const paragraphs = paragraphSource.split(/\n{2,}/)

  return paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('')
}

function normalizeDesktopOverlayHtml(content: string) {
  const trimmedContent = content.trim()
  if (!trimmedContent) {
    return ''
  }

  if (typeof DOMParser === 'undefined') {
    return trimmedContent
  }

  const parsed = new DOMParser().parseFromString(trimmedContent, 'text/html')
  parsed.querySelectorAll('script,style,link,meta,svg').forEach((node) => node.remove())

  parsed.querySelectorAll('img').forEach((image) => {
    const currentStyle = image.getAttribute('style')?.trim()
    const styles = [
      currentStyle?.replace(/;$/, ''),
      'display:block',
      'max-width:100%',
      'height:auto',
      'margin:0 auto',
    ].filter(Boolean)

    image.removeAttribute('loading')
    image.setAttribute('style', styles.join('; '))
    if (!image.getAttribute('alt')) {
      image.setAttribute('alt', '')
    }
  })

  parsed.querySelectorAll('figure').forEach((figure) => {
    const currentStyle = figure.getAttribute('style')?.trim()
    const styles = [currentStyle?.replace(/;$/, ''), 'margin:0 0 1em'].filter(Boolean)
    figure.setAttribute('style', styles.join('; '))
  })

  return parsed.body.innerHTML.trim()
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
