import { BookOpen, Clock, FileText, Image, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Tooltip } from 'antd'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import styles from './Sidebar.module.css'

export interface Category {
  id: string
  label: string
  icon: React.ReactNode
}

export interface SidebarProps {
  categories?: Category[]
  selectedCategory: string
  onSelectCategory: (categoryId: string) => void
}

const defaultCategories: Category[] = [
  { id: 'all', label: '全部', icon: <BookOpen size={20} /> },
  { id: 'recent', label: '最近阅读', icon: <Clock size={20} /> },
  { id: 'novel', label: '小说', icon: <FileText size={20} /> },
  { id: 'manga', label: '漫画', icon: <Image size={20} /> },
]

/**
 * Sidebar 侧边栏组件
 * 展示分类导航和设置入口
 */
export default function Sidebar({
  categories = defaultCategories,
  selectedCategory,
  onSelectCategory,
}: SidebarProps) {
  const navigate = useNavigate()
  // 检测是否处于收缩状态（窗口宽度 ≤ 1000px）
  const isCollapsed = useMediaQuery('(max-width: 1000px)')

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <BookOpen size={28} />
        </div>
        <h1 className={styles.title}>Tfiction</h1>
      </div>

      <nav className={styles.nav}>
        {categories.map((category) => {
          const button = (
            <button
              key={category.id}
              className={`${styles.navItem} ${
                selectedCategory === category.id ? styles.active : ''
              }`}
              onClick={() => onSelectCategory(category.id)}
            >
              <span className={styles.navIcon}>{category.icon}</span>
              <span className={styles.navLabel}>{category.label}</span>
            </button>
          )

          // 只在收缩状态下显示 Tooltip
          return isCollapsed ? (
            <Tooltip key={category.id} title={category.label} placement="right" mouseEnterDelay={0.3}>
              {button}
            </Tooltip>
          ) : (
            button
          )
        })}

        {isCollapsed ? (
          <Tooltip title="设置" placement="right" mouseEnterDelay={0.3}>
            <button className={styles.settingsButton} onClick={() => navigate('/settings')}>
              <span className={styles.settingsIcon}>
                <Settings size={20} />
              </span>
              <span className={styles.settingsLabel}>设置</span>
            </button>
          </Tooltip>
        ) : (
          <button className={styles.settingsButton} onClick={() => navigate('/settings')}>
            <span className={styles.settingsIcon}>
              <Settings size={20} />
            </span>
            <span className={styles.settingsLabel}>设置</span>
          </button>
        )}
      </nav>
    </aside>
  )
}
