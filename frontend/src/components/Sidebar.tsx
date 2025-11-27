import { useNovelStore } from '@stores/novelStore'

/**
 * Sidebar 组件
 * 侧边栏，显示章节列表和最近打开的小说
 */
export default function Sidebar() {
  const { currentNovel, setCurrentChapter } = useNovelStore()

  return (
    <div
      className="sidebar"
      style={{
        width: '280px',
        backgroundColor: '#fafafa',
        borderRight: '1px solid #e0e0e0',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>章节目录</h3>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {currentNovel && currentNovel.chapters.length > 0 ? (
          <div style={{ padding: '0.5rem' }}>
            {currentNovel.chapters.map((chapter) => (
              <div
                key={chapter.index}
                onClick={() => setCurrentChapter(chapter.index)}
                style={{
                  padding: '0.75rem',
                  margin: '0.25rem 0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor:
                    currentNovel.currentChapter === chapter.index
                      ? '#e3f2fd'
                      : 'transparent',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (currentNovel.currentChapter !== chapter.index) {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentNovel.currentChapter !== chapter.index) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                  {chapter.title}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: '#999',
            }}
          >
            暂无章节
          </div>
        )}
      </div>
    </div>
  )
}
