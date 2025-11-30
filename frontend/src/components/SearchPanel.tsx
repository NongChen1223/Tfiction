import { useState } from 'react'

interface SearchPanelProps {
  onClose: () => void
}

/**
 * SearchPanel 组件
 * 搜索面板，提供全文搜索功能
 */
export default function SearchPanel({ onClose }: SearchPanelProps) {
  const [keyword, setKeyword] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [searchResults] = useState<any[]>([])

  const handleSearch = () => {
    // TODO: 调用后端搜索服务
    console.log('搜索关键字:', keyword, '区分大小写:', caseSensitive)
  }

  return (
    <div
      className="search-panel"
      style={{
        width: '320px',
        backgroundColor: '#fff',
        borderLeft: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 搜索头部 */}
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>搜索</h3>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '20px',
          }}
        >
          ×
        </button>
      </div>

      {/* 搜索输入 */}
      <div style={{ padding: '1rem' }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="输入搜索关键字..."
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            区分大小写
          </label>
        </div>
        <button
          onClick={handleSearch}
          style={{
            width: '100%',
            marginTop: '0.5rem',
            padding: '0.5rem',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#0ea5e9',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          搜索
        </button>
      </div>

      {/* 搜索结果 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
        {searchResults.length > 0 ? (
          searchResults.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '0.25rem' }}>
                第 {result.line} 行
              </div>
              <div style={{ fontSize: '14px' }}>{result.context}</div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: '2rem 0' }}>
            {keyword ? '未找到匹配结果' : '输入关键字开始搜索'}
          </div>
        )}
      </div>
    </div>
  )
}
