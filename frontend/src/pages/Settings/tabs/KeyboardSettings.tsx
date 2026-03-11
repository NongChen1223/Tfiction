import { useEffect, useMemo, useRef, useState } from 'react'
import type { ShortcutAction } from '@/types'
import { useSettingsStore } from '@/stores/settingsStore'
import { useClickOutside } from '@/hooks/useClickOutside'
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_META,
  buildShortcutFromKeys,
  getDuplicateShortcutAction,
  hasNonModifierKey,
  normalizeKeyName,
} from '@/utils/shortcuts'
import styles from './KeyboardSettings.module.scss'

/**
 * 快捷键设置选项卡
 */
export default function KeyboardSettings() {
  const { keyboardShortcuts, setKeyboardShortcut, resetKeyboardShortcuts } = useSettingsStore()
  const [recordingAction, setRecordingAction] = useState<ShortcutAction | null>(null)
  const [recordingShortcut, setRecordingShortcut] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const buttonRefs = useRef<Partial<Record<ShortcutAction, HTMLButtonElement | null>>>({})
  const activeButtonRef = useRef<HTMLButtonElement>(null)
  const pressedKeysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    activeButtonRef.current = recordingAction
      ? buttonRefs.current[recordingAction] || null
      : null
  }, [recordingAction])

  useClickOutside(activeButtonRef, Boolean(recordingAction), () => {
    setRecordingAction(null)
    setRecordingShortcut('')
    setErrorMessage('')
    pressedKeysRef.current.clear()
  })

  useEffect(() => {
    if (!recordingAction) {
      return
    }

    const clearRecordingState = () => {
      setRecordingAction(null)
      setRecordingShortcut('')
      setErrorMessage('')
      pressedKeysRef.current.clear()
    }

    const handleWindowKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const normalizedKey = normalizeKeyName(event.key)

      if (normalizedKey === 'Backspace' || normalizedKey === 'Delete') {
        setKeyboardShortcut(recordingAction, DEFAULT_SHORTCUTS[recordingAction])
        clearRecordingState()
        return
      }

      pressedKeysRef.current.add(normalizedKey)
      setRecordingShortcut(buildShortcutFromKeys(pressedKeysRef.current))
    }

    const handleWindowKeyUp = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const normalizedKey = normalizeKeyName(event.key)
      const currentShortcut = buildShortcutFromKeys(pressedKeysRef.current)

      if (hasNonModifierKey(currentShortcut) && !['Ctrl', 'Shift', 'Alt', 'Meta'].includes(normalizedKey)) {
        const duplicateAction = getDuplicateShortcutAction(
          keyboardShortcuts,
          recordingAction,
          currentShortcut
        )

        if (duplicateAction) {
          setErrorMessage(
            `快捷键 ${currentShortcut} 已被「${SHORTCUT_META[duplicateAction].action}」占用`
          )
        } else {
          setKeyboardShortcut(recordingAction, currentShortcut)
          clearRecordingState()
          return
        }
      }

      pressedKeysRef.current.delete(normalizedKey)
      setRecordingShortcut(buildShortcutFromKeys(pressedKeysRef.current))
    }

    window.addEventListener('keydown', handleWindowKeyDown, true)
    window.addEventListener('keyup', handleWindowKeyUp, true)

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown, true)
      window.removeEventListener('keyup', handleWindowKeyUp, true)
    }
  }, [keyboardShortcuts, recordingAction, setKeyboardShortcut])

  const groupedShortcuts = useMemo(() => {
    return (Object.keys(SHORTCUT_META) as ShortcutAction[]).reduce(
      (acc, action) => {
        const meta = SHORTCUT_META[action]
        if (!acc[meta.category]) {
          acc[meta.category] = []
        }
        acc[meta.category].push({
          actionId: action,
          action: meta.action,
          description: meta.description,
          key: keyboardShortcuts[action],
        })
        return acc
      },
      {} as Record<
        string,
        Array<{
          actionId: ShortcutAction
          action: string
          description: string
          key: string
        }>
      >
    )
  }, [keyboardShortcuts])

  return (
    <div className={styles.container}>
      {Object.entries(groupedShortcuts).map(([category, items]) => (
        <section key={category} className={styles.section}>
          <h2 className={styles.sectionTitle}>{category}</h2>
          <div className={styles.shortcutList}>
            {items.map((shortcut) => (
              <div key={shortcut.actionId} className={styles.shortcutItem}>
                <div className={styles.shortcutInfo}>
                  <span className={styles.shortcutAction}>{shortcut.action}</span>
                  <span className={styles.shortcutDescription}>{shortcut.description}</span>
                </div>
                <button
                  ref={(node) => {
                    buttonRefs.current[shortcut.actionId] = node
                  }}
                  type="button"
                  className={`${styles.shortcutKeyButton} ${
                    recordingAction === shortcut.actionId ? styles.recording : ''
                  }`}
                  onClick={() => {
                    if (recordingAction === shortcut.actionId) {
                      setRecordingAction(null)
                      setRecordingShortcut('')
                      setErrorMessage('')
                      pressedKeysRef.current.clear()
                      return
                    }

                    setRecordingAction(shortcut.actionId)
                    setRecordingShortcut('')
                    setErrorMessage('')
                    pressedKeysRef.current.clear()
                    buttonRefs.current[shortcut.actionId]?.focus()
                  }}
                >
                  {recordingAction === shortcut.actionId
                    ? recordingShortcut || '按下新组合键'
                    : shortcut.key}
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className={styles.section}>
        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            点击右侧按键开始录制。按 `Delete` 或 `Backspace` 可恢复该项默认值。
          </p>
          <p className={styles.infoText}>
            页面级快捷键已经接入阅读器，包括 BOSS 模式切换、快速隐藏、搜索、翻章和返回书架。
          </p>
          {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
          <button type="button" className={styles.resetButton} onClick={resetKeyboardShortcuts}>
            恢复全部默认快捷键
          </button>
        </div>
      </section>
    </div>
  )
}
