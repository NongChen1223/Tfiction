import { Outlet } from 'react-router-dom'
import styles from './MainLayout.module.scss'

/**
 * MainLayout 主布局组件
 */
export default function MainLayout() {
  return (
    <div className={styles.layout}>
      <Outlet />
    </div>
  )
}
