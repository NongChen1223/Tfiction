import { RouterProvider } from 'react-router-dom'
import { router } from './router'

/**
 * App 根组件
 * 使用 React Router 进行路由管理
 */
export default function App() {
  return <RouterProvider router={router} />
}
