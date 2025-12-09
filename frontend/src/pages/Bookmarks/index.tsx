import styles from './Bookmarks.module.css'

/**
 * Bookmarks 书签管理页面
 * 显示和管理用户添加的书签
 */
export default function Bookmarks() {
  return (
    <div className={styles.bookmarks}>
      <div className={styles.container}>
        <h1 className={styles.title}>书签管理</h1>
        <p className={styles.subtitle}>暂无书签</p>
      </div>
    </div>
  )
}
