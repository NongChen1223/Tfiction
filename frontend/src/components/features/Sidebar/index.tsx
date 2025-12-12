import { BookOpen, Clock, FileText, Image, Heart, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
  { id: 'favorites', label: '收藏', icon: <Heart size={20} /> },
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

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <BookOpen size={28} />
        </div>
        <h1 className={styles.title}>Tfiction</h1>
      </div>

      <nav className={styles.nav}>
        {categories.map((category) => (
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
        ))}

        <button className={styles.settingsButton} onClick={() => navigate('/settings')}>
          <span className={styles.settingsIcon}>
            <Settings size={20} />
          </span>
          <span className={styles.settingsLabel}>设置</span>
        </button>
      </nav>
    </aside>
  )
}
