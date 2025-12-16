import { Outlet } from 'react-router-dom'
import { useWindowStore } from '@/stores/windowStore'
import styles from './MainLayout.module.scss'

/**
 * MainLayout 主布局组件
 * 包含窗口状态管理和摸鱼模式
 */
export default function MainLayout() {
  const { isStealthMode } = useWindowStore()

  return (
    <div className={`${styles.layout} ${isStealthMode ? styles.stealthMode : ''}`}>
      <Outlet />
    </div>
  )
}
