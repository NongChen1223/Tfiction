import { Folder, HardDrive } from 'lucide-react'
import Button from '@/components/common/Button'
import styles from './StorageSettings.module.css'

/**
 * 存储管理选项卡
 */
export default function StorageSettings() {
  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>书库路径</h2>
        <p className={styles.sectionDescription}>设置小说和漫画的存储位置</p>

        <div className={styles.pathItem}>
          <div className={styles.pathInfo}>
            <Folder size={24} />
            <div className={styles.pathText}>
              <span className={styles.pathLabel}>当前路径：</span>
              <span className={styles.pathValue}>/Users/用户名/Documents/TFiction Library</span>
            </div>
          </div>
          <Button variant="secondary" size="sm">更改路径</Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>存储分析</h2>
        <div className={styles.storageGrid}>
          <div className={styles.storageCard}>
            <HardDrive size={32} />
            <div className={styles.storageInfo}>
              <span className={styles.storageLabel}>已用空间</span>
              <span className={styles.storageValue}>1.2 GB</span>
            </div>
          </div>
          <div className={styles.storageCard}>
            <div className={styles.storageInfo}>
              <span className={styles.storageLabel}>小说文件</span>
              <span className={styles.storageValue}>850 MB</span>
            </div>
          </div>
          <div className={styles.storageCard}>
            <div className={styles.storageInfo}>
              <span className={styles.storageLabel}>漫画文件</span>
              <span className={styles.storageValue}>350 MB</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
