import type { ShortcutAction, ShortcutMap } from '@/types'

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  toggleBossMode: 'Ctrl+Shift+H',
  quickHide: 'Escape',
  openSearch: 'Ctrl+F',
  prevChapter: 'ArrowLeft',
  nextChapter: 'ArrowRight',
  goHome: 'Ctrl+H',
}

export const SHORTCUT_META: Record<
  ShortcutAction,
  { action: string; category: string; description: string }
> = {
  toggleBossMode: {
    action: '老板键（切换隐身模式）',
    category: '窗口控制',
    description: '进入或退出 BOSS 模式',
  },
  quickHide: {
    action: '快速隐藏',
    category: '窗口控制',
    description: '立即隐藏当前阅读内容',
  },
  openSearch: {
    action: '打开搜索',
    category: '通用',
    description: '呼出全文搜索面板',
  },
  prevChapter: {
    action: '上一章',
    category: '阅读器',
    description: '切换到上一章',
  },
  nextChapter: {
    action: '下一章',
    category: '阅读器',
    description: '切换到下一章',
  },
  goHome: {
    action: '返回书架',
    category: '导航',
    description: '返回首页书架',
  },
}

const MODIFIER_ORDER = ['Ctrl', 'Shift', 'Alt', 'Meta'] as const
const DOUBLE_SHORTCUT_PREFIX = 'Double:'
const DOUBLE_SHORTCUT_LABEL = '双击 '
const DOUBLE_SHORTCUT_INTERVAL_MS = 360
const shortcutTriggerHistory = new Map<string, number>()

type ParsedShortcutBinding = {
  mode: 'single' | 'double'
  shortcut: string
}

export function normalizeShortcut(input: string) {
  const parts = input
    .split('+')
    .map((part) => normalizeKeyToken(part))
    .filter(Boolean)

  const modifiers = MODIFIER_ORDER.filter((modifier) => parts.includes(modifier))
  const nonModifiers = parts.filter((part) => !MODIFIER_ORDER.includes(part as never))
  const unique = Array.from(new Set([...modifiers, ...nonModifiers]))
  return unique.join('+')
}

export function normalizeShortcutBinding(input: string) {
  const parsed = parseShortcutBinding(input)
  if (!parsed.shortcut) {
    return ''
  }

  return parsed.mode === 'double'
    ? `${DOUBLE_SHORTCUT_PREFIX}${parsed.shortcut}`
    : parsed.shortcut
}

export function eventToShortcut(event: KeyboardEvent | React.KeyboardEvent<HTMLElement>) {
  const parts: string[] = []
  if (event.ctrlKey) parts.push('Ctrl')
  if (event.shiftKey) parts.push('Shift')
  if (event.altKey) parts.push('Alt')
  if (event.metaKey) parts.push('Meta')

  const key = normalizeEventKey(event.key)
  if (!isModifierKey(key)) {
    parts.push(key)
  }

  return normalizeShortcut(parts.join('+'))
}

export function matchesShortcut(
  event: KeyboardEvent | React.KeyboardEvent<HTMLElement>,
  shortcut: string
) {
  const parsed = parseShortcutBinding(shortcut)
  if (!parsed.shortcut) {
    return false
  }

  if ('repeat' in event && event.repeat) {
    return false
  }

  if (eventToShortcut(event) !== parsed.shortcut) {
    return false
  }

  if (parsed.mode === 'single') {
    return true
  }

  const now = Number(event.timeStamp || Date.now())
  const lastTriggeredAt = shortcutTriggerHistory.get(parsed.shortcut) || 0
  shortcutTriggerHistory.set(parsed.shortcut, now)

  if (now - lastTriggeredAt <= DOUBLE_SHORTCUT_INTERVAL_MS) {
    shortcutTriggerHistory.delete(parsed.shortcut)
    return true
  }

  return false
}

export function getDuplicateShortcutAction(
  shortcuts: ShortcutMap,
  targetAction: ShortcutAction,
  candidate: string
) {
  const candidateConflictKey = getShortcutConflictKey(candidate)
  return (Object.keys(shortcuts) as ShortcutAction[]).find(
    (action) =>
      action !== targetAction &&
      getShortcutConflictKey(shortcuts[action]) === candidateConflictKey
  )
}

export function isShortcutRecorderEvent(
  event: KeyboardEvent | React.KeyboardEvent<HTMLElement>
) {
  const shortcut = eventToShortcut(event)
  return hasNonModifierKey(shortcut)
}

export function hasNonModifierKey(shortcut: string) {
  const parsed = parseShortcutBinding(shortcut)
  if (!parsed.shortcut) {
    return false
  }

  const parts = parsed.shortcut
    .split('+')
    .filter(Boolean)

  return parts.some((part) => !isModifierKey(part))
}

export function normalizeKeyName(key: string) {
  return normalizeEventKey(key)
}

export function buildShortcutFromKeys(keys: Iterable<string>) {
  return normalizeShortcut(Array.from(keys).join('+'))
}

export function buildDoubleShortcutBinding(shortcut: string) {
  const normalizedShortcut = normalizeShortcut(shortcut)
  return normalizedShortcut ? `${DOUBLE_SHORTCUT_PREFIX}${normalizedShortcut}` : ''
}

export function formatShortcutLabel(shortcut: string) {
  const parsed = parseShortcutBinding(shortcut)
  if (!parsed.shortcut) {
    return ''
  }

  return parsed.mode === 'double'
    ? `${parsed.shortcut} + ${parsed.shortcut}`
    : parsed.shortcut
}

function getShortcutConflictKey(shortcut: string) {
  return parseShortcutBinding(shortcut).shortcut
}

function parseShortcutBinding(input: string): ParsedShortcutBinding {
  const trimmedInput = input.trim()
  if (!trimmedInput) {
    return { mode: 'single', shortcut: '' }
  }

  if (trimmedInput.startsWith(DOUBLE_SHORTCUT_PREFIX)) {
    return {
      mode: 'double',
      shortcut: normalizeShortcut(trimmedInput.slice(DOUBLE_SHORTCUT_PREFIX.length)),
    }
  }

  if (trimmedInput.startsWith(DOUBLE_SHORTCUT_LABEL)) {
    return {
      mode: 'double',
      shortcut: normalizeShortcut(trimmedInput.slice(DOUBLE_SHORTCUT_LABEL.length)),
    }
  }

  return {
    mode: 'single',
    shortcut: normalizeShortcut(trimmedInput),
  }
}

function normalizeKeyToken(token: string) {
  const trimmed = token.trim()
  if (!trimmed) {
    return ''
  }

  return normalizeEventKey(trimmed)
}

function normalizeEventKey(key: string) {
  switch (key.toLowerCase()) {
    case 'control':
    case 'ctrl':
      return 'Ctrl'
    case 'shift':
      return 'Shift'
    case 'alt':
    case 'option':
      return 'Alt'
    case 'meta':
    case 'command':
    case 'cmd':
      return 'Meta'
    case 'esc':
      return 'Escape'
    case ' ':
    case 'space':
    case 'spacebar':
      return 'Space'
    case 'arrowleft':
      return 'ArrowLeft'
    case 'arrowright':
      return 'ArrowRight'
    case 'arrowup':
      return 'ArrowUp'
    case 'arrowdown':
      return 'ArrowDown'
    case 'pagedown':
      return 'PageDown'
    case 'pageup':
      return 'PageUp'
    default: {
      if (key.length === 1) {
        return key.toUpperCase()
      }
      return key.charAt(0).toUpperCase() + key.slice(1)
    }
  }
}

function isModifierKey(key: string) {
  return MODIFIER_ORDER.includes(key as (typeof MODIFIER_ORDER)[number])
}
