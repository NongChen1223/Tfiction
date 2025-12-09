import styles from './Settings.module.css'

/**
 * Settings 设置页面
 * 用户可以调整阅读设置、应用设置等
 */
export default function Settings() {
  return (
    <div className={styles.settings}>
      <div className={styles.container}>
        <h1 className={styles.title}>设置</h1>
        <p className={styles.subtitle}>阅读设置和应用配置</p>
      </div>
    </div>
  )
}
