import { useWindowStore } from '@stores/windowStore'

interface ToolbarProps {
  onToggleSidebar: () => void
  onToggleSearch: () => void
}

/**
 * Toolbar 组件
 * 顶部工具栏，包含各种操作按钮
 */
export default function Toolbar({ onToggleSidebar, onToggleSearch }: ToolbarProps) {
  const { isStealthMode, toggleStealthMode, isAlwaysOnTop } = useWindowStore()

  const handleOpenFile = () => {
    // TODO: 调用 Wails 的文件选择对话框
    console.log('打开文件')
  }

  return (
    <div
      className="toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        gap: '0.5rem',
      }}
    >
      <button onClick={onToggleSidebar} style={buttonStyle}>
        侧边栏
      </button>
      <button onClick={handleOpenFile} style={buttonStyle}>
        打开文件
      </button>
      <button onClick={onToggleSearch} style={buttonStyle}>
        搜索
      </button>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={toggleStealthMode}
          style={{
            ...buttonStyle,
            backgroundColor: isStealthMode ? '#0ea5e9' : '#fff',
            color: isStealthMode ? '#fff' : '#333',
          }}
        >
          摸鱼模式 {isStealthMode ? 'ON' : 'OFF'}
        </button>
        <span style={{ padding: '0.25rem 0.5rem', color: '#666' }}>
          {isAlwaysOnTop ? '已置顶' : '未置顶'}
        </span>
      </div>
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: '0.25rem 0.75rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  backgroundColor: '#fff',
  cursor: 'pointer',
  fontSize: '14px',
}
