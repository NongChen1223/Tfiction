import { Outlet } from 'react-router-dom'
import { useWindowStore } from '@/stores/windowStore'
import styles from './MainLayout.module.css'

/**
 * MainLayout 主布局组件
 * 包含所有页面的外层容器，处理窗口级别的样式和状态
 */
export default function MainLayout() {
  const { isStealthMode } = useWindowStore()

  return (
    <div
      className={`${styles.layout} ${isStealthMode ? styles.stealthMode : ''}`}
    >
      <Outlet />
    </div>
  )
}
