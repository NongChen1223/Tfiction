import styles from './Home.module.css'

/**
 * Home 首页（书架页面）
 * 显示用户的小说列表、最近阅读等
 */
export default function Home() {
  return (
    <div className={styles.home}>
      <div className={styles.container}>
        <h1 className={styles.title}>我的书架</h1>
        <p className={styles.subtitle}>
          暂无小说，点击"打开文件"导入小说开始阅读
        </p>
      </div>
    </div>
  )
}
