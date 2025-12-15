import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import Home from '@/pages/Home'
import Reader from '@/pages/Reader'
import Settings from '@/pages/Settings'

/**
 * 路由配置
 * 使用 BrowserRouter 进行路由管理
 *
 * 路由结构：
 * / - 主布局
 *   /home - 首页（书架）
 *   /reader - 阅读器
 *   /settings - 设置
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: 'home',
        element: <Home />,
      },
      {
        path: 'reader',
        element: <Reader />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
])
