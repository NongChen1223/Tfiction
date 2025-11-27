import { useState, useEffect } from 'react'
import { useNovelStore } from '@stores/novelStore'
import { useWindowStore } from '@stores/windowStore'
import NovelReader from '@components/NovelReader'
import Toolbar from '@components/Toolbar'
import Sidebar from '@components/Sidebar'
import SearchPanel from '@components/SearchPanel'
import './App.css'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { isStealthMode } = useWindowStore()
  const { currentNovel } = useNovelStore()

  useEffect(() => {
    // 监听应用就绪事件
    // EventsOn('app:ready', (data: any) => {
    //   console.log('App ready:', data)
    // })

    return () => {
      // 清理事件监听
      // EventsOff('app:ready')
    }
  }, [])

  return (
    <div
      className={`app-container ${isStealthMode ? 'stealth-mode' : ''}`}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* 工具栏 */}
      <Toolbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
      />

      {/* 主体内容 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 侧边栏 */}
        {isSidebarOpen && <Sidebar />}

        {/* 阅读器 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {currentNovel ? (
            <NovelReader />
          ) : (
            <div className="welcome-screen">
              <h2>欢迎使用 Tfiction</h2>
              <p>请打开一本小说开始阅读</p>
            </div>
          )}
        </div>

        {/* 搜索面板 */}
        {isSearchOpen && <SearchPanel onClose={() => setIsSearchOpen(false)} />}
      </div>
    </div>
  )
}

export default App
