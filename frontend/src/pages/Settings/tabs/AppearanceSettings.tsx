import { Sun, Moon, Leaf } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import styles from './AppearanceSettings.module.css'

/**
 * 外观设置选项卡
 * 包含主题选择等外观相关设置
 */
export default function AppearanceSettings() {
  const { theme, setTheme } = useThemeStore()

  const themes = [
    {
      id: 'light' as const,
      name: '白天模式',
      description: '浅色背景，适合光线充足的环境',
      icon: <Sun size={32} />,
      preview: 'linear-gradient(135deg, #ffffff, #f9fafb)',
    },
    {
      id: 'dark' as const,
      name: '夜间模式',
      description: '深色背景，保护眼睛，适合夜间阅读',
      icon: <Moon size={32} />,
      preview: 'linear-gradient(135deg, #0a0e14, #0f141e)',
    },
    {
      id: 'sepia' as const,
      name: '护眼模式',
      description: '豆沙绿背景，长时间阅读更舒适',
      icon: <Leaf size={32} />,
      preview: 'linear-gradient(135deg, #e1dccd, #d7d2c3)',
    },
  ]

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>主题模式</h2>
        <p className={styles.sectionDescription}>选择适合你的阅读环境和习惯的主题</p>

        <div className={styles.themeGrid}>
          {themes.map((themeOption) => (
            <button
              key={themeOption.id}
              className={`${styles.themeCard} ${theme === themeOption.id ? styles.active : ''}`}
              onClick={() => setTheme(themeOption.id)}
            >
              <div
                className={styles.themePreview}
                style={{ background: themeOption.preview }}
              >
                <div className={styles.themeIcon}>{themeOption.icon}</div>
              </div>
              <div className={styles.themeInfo}>
                <h3 className={styles.themeName}>{themeOption.name}</h3>
                <p className={styles.themeDescription}>{themeOption.description}</p>
              </div>
              {theme === themeOption.id && (
                <div className={styles.activeIndicator}>
                  <div className={styles.activeDot} />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>提示</h2>
        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            💡 主题设置会自动保存，下次打开时自动应用
          </p>
          <p className={styles.infoText}>
            💡 护眼模式使用豆沙绿配色，适合长时间阅读
          </p>
        </div>
      </section>
    </div>
  )
}
