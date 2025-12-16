import { Clock, TrendingUp, BookOpen, Award } from 'lucide-react'
import styles from './StatisticsSettings.module.scss'

/**
 * 阅读统计选项卡
 */
export default function StatisticsSettings() {
  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>阅读时长</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Clock size={32} />
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>今日阅读</span>
              <span className={styles.statValue}>2小时15分钟</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <TrendingUp size={32} />
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>本周总计</span>
              <span className={styles.statValue}>12小时30分钟</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>阅读成就</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <BookOpen size={32} />
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>已完成书籍</span>
              <span className={styles.statValue}>3本</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <Award size={32} />
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>总阅读页数</span>
              <span className={styles.statValue}>1250页</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
