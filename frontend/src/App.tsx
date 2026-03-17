import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useFixWailsDrag } from './hooks/useFixWailsDrag'

/**
 * App 根组件。
 * 负责挂载全局路由，并在桌面端补上 Wails 窗口拖拽区域修复。
 */
export default function App() {
  useFixWailsDrag()
  return <RouterProvider router={router} />
}
