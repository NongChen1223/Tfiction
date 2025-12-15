import { useState } from 'react'
import { Search, Grid, List, Plus } from 'lucide-react'
import type { Book, ViewMode } from '@/types'
import Sidebar from '@/components/features/Sidebar'
import BookCard from '@/components/features/BookCard'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import styles from './Home.module.css'

// 模拟书籍数据
const mockBooks: Book[] = [
  {
    id: '1',
    title: '三体',
    author: '刘慈欣',
    type: 'novel',
    progress: 65,
    category: '科幻',
    lastReadTime: Date.now() - 86400000,
    filePath: '/path/to/threebody.txt',
    format: 'txt',
  },
  {
    id: '2',
    title: '流浪地球',
    author: '刘慈欣',
    type: 'novel',
    progress: 100,
    category: '科幻',
    lastReadTime: Date.now() - 172800000,
    filePath: '/path/to/wandering.txt',
    format: 'txt',
  },
  {
    id: '3',
    title: '球状闪电',
    author: '刘慈欣',
    type: 'novel',
    progress: 32,
    category: '科幻',
    lastReadTime: Date.now() - 259200000,
    filePath: '/path/to/lightning.txt',
    format: 'txt',
  },
]

/**
 * Home 页面 - 书架/图书馆视图
 */
export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  // 过滤书籍
  const filteredBooks = mockBooks.filter((book) => {
    // 分类过滤
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'recent') {
        // 最近阅读：7天内
        const sevenDaysAgo = Date.now() - 7 * 86400000
        if (!book.lastReadTime || book.lastReadTime < sevenDaysAgo) return false
      } else if (selectedCategory !== book.type && selectedCategory !== book.category) {
        return false
      }
    }

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      )
    }

    return true
  })

  const handleImport = () => {
    // TODO: 实现导入功能
    console.log('Import book')
  }

  const handleOpenBook = (book: Book) => {
    // TODO: 打开阅读器
    console.log('Open book:', book)
  }

  const handleEditBook = (book: Book) => {
    // TODO: 编辑书籍信息
    console.log('Edit book:', book)
  }

  const handleDeleteBook = (book: Book) => {
    // TODO: 删除书籍
    console.log('Delete book:', book)
  }

  return (
    <div className={styles.container}>
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <main className={styles.main}>
        <header className={styles.header} style={{ '--wails-draggable': 'drag' } as React.CSSProperties}>
          <Input
            icon={<Search size={20} />}
            placeholder="搜索书名或作者..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            className={styles.searchInput}
          />

          <div className={styles.toolbar}>
            <div className={styles.viewModeToggle}>
              <button
                className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="网格视图"
                title="网格视图"
              >
                <Grid size={20} />
              </button>
              <button
                className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="列表视图"
                title="列表视图"
              >
                <List size={20} />
              </button>
            </div>

            <Button icon={<Plus size={20} />} onClick={handleImport}>
              导入书籍
            </Button>
          </div>
        </header>

        <div className={styles.content}>
          {filteredBooks.length > 0 ? (
            <div className={`${styles.booksList} ${styles[viewMode]}`}>
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  viewMode={viewMode}
                  onOpen={handleOpenBook}
                  onEdit={handleEditBook}
                  onDelete={handleDeleteBook}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyText}>
                {searchQuery ? '没有找到匹配的书籍' : '还没有书籍，点击导入按钮添加'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
