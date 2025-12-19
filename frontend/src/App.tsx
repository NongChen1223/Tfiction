import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useFixWailsDrag } from './hooks/useFixWailsDrag'

/**
 * App 根组件
 * 使用 React Router 进行路由管理
 */
export default function App() {
  // 修复 Wails 窗口隐藏后拖拽失效的问题
  useFixWailsDrag()

  return <RouterProvider router={router} />
}
