import styles from './KeyboardSettings.module.css'

/**
 * 快捷键设置选项卡
 */
export default function KeyboardSettings() {
  const shortcuts = [
    { action: '老板键（隐身模式）', key: 'Ctrl+Shift+H', category: '窗口控制' },
    { action: '快速隐藏', key: 'ESC', category: '窗口控制' },
    { action: '下一页', key: '→ / PageDown', category: '阅读器' },
    { action: '上一页', key: '← / PageUp', category: '阅读器' },
    { action: '打开搜索', key: 'Ctrl+F', category: '通用' },
    { action: '返回书架', key: 'Ctrl+H', category: '导航' },
  ]

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, typeof shortcuts>)

  return (
    <div className={styles.container}>
      {Object.entries(groupedShortcuts).map(([category, items]) => (
        <section key={category} className={styles.section}>
          <h2 className={styles.sectionTitle}>{category}</h2>
          <div className={styles.shortcutList}>
            {items.map((shortcut, index) => (
              <div key={index} className={styles.shortcutItem}>
                <span className={styles.shortcutAction}>{shortcut.action}</span>
                <span className={styles.shortcutKey}>{shortcut.key}</span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className={styles.section}>
        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            💡 快捷键设置暂不支持自定义，将在后续版本中添加
          </p>
        </div>
      </section>
    </div>
  )
}
