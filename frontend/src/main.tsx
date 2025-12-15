import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme as antdTheme } from 'antd'
import { useThemeStore, initTheme } from './stores/themeStore'
import App from './App'
import './index.css'

// 初始化主题
initTheme()

function Root() {
  const theme = useThemeStore((state) => state.theme)

  // 根据主题选择主色调
  const getPrimaryColor = () => {
    switch (theme) {
      case 'light':
        return '#3B82F6' // 蓝色
      case 'dark':
        return '#9333ea' // 紫色
      case 'sepia':
        return '#3B82F6' // 蓝色（护眼模式也用蓝色）
      default:
        return '#3B82F6'
    }
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: getPrimaryColor(),
          borderRadius: 12, // 圆角 --radius-lg
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        },
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <App />
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
