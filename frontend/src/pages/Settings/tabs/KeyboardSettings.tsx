import { useMemo, useState } from 'react'
import type { ShortcutAction } from '@/types'
import { useSettingsStore } from '@/stores/settingsStore'
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_META,
  eventToShortcut,
  getDuplicateShortcutAction,
  isShortcutRecorderEvent,
} from '@/utils/shortcuts'
import styles from './KeyboardSettings.module.scss'

/**
 * 快捷键设置选项卡
 */
export default function KeyboardSettings() {
  const { keyboardShortcuts, setKeyboardShortcut, resetKeyboardShortcuts } = useSettingsStore()
  const [recordingAction, setRecordingAction] = useState<ShortcutAction | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

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

  const handleShortcutRecord = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    action: ShortcutAction
  ) => {
    event.preventDefault()
    event.stopPropagation()
    setErrorMessage('')

    if (event.key === 'Backspace' || event.key === 'Delete') {
      setKeyboardShortcut(action, DEFAULT_SHORTCUTS[action])
      setRecordingAction(null)
      return
    }

    if (!isShortcutRecorderEvent(event)) {
      return
    }

    const shortcut = eventToShortcut(event)
    if (!shortcut) {
      return
    }

    const duplicateAction = getDuplicateShortcutAction(
      keyboardShortcuts,
      action,
      shortcut
    )

    if (duplicateAction) {
      setErrorMessage(
        `快捷键 ${shortcut} 已被「${SHORTCUT_META[duplicateAction].action}」占用`
      )
      return
    }

    setKeyboardShortcut(action, shortcut)
    setRecordingAction(null)
  }

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
                  type="button"
                  className={`${styles.shortcutKeyButton} ${
                    recordingAction === shortcut.actionId ? styles.recording : ''
                  }`}
                  onClick={() => {
                    setRecordingAction(shortcut.actionId)
                    setErrorMessage('')
                  }}
                  onKeyDown={(event) => handleShortcutRecord(event, shortcut.actionId)}
                >
                  {recordingAction === shortcut.actionId ? '按下新组合键' : shortcut.key}
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
