import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#9333ea', // 主紫色
          borderRadius: 12, // 圆角 --radius-lg
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        },
        algorithm: theme.defaultAlgorithm, // 可以改成 theme.darkAlgorithm 切换暗色主题
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
