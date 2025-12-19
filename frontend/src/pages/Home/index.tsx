import { useState } from 'react'
import { Search, Grid, List, Plus, ArrowUpDown, Clock, Maximize2, SortAsc, FolderPlus, FileText, FolderInput, FilePlus } from 'lucide-react'
import { Popover } from 'antd'
import type { Book, ViewMode, SortMode } from '@/types'
import Sidebar from '@/components/features/Sidebar'
import BookCard from '@/components/features/BookCard'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import ImportModal, { type ModalOption } from '@/components/features/ImportModal'
import SelectFilesModal from '@/components/features/SelectFilesModal'
import styles from './Home.module.scss'

// 模拟书籍数据
const mockBooks: Book[] = [
  // 单文件 - 小说
  {
    id: '1',
    title: '球状闪电',
    author: '刘慈欣',
    type: 'novel',
    category: '科幻',
    isDirectory: false,
    filePath: '/path/to/lightning.txt',
    format: 'txt',
    progress: 32,
    fileSize: 1024000,
    lastReadTime: Date.now() - 86400000,
    createdAt: Date.now() - 259200000,
  },
  // 目录 - 小说系列
  {
    id: '2',
    title: '三体系列',
    author: '刘慈欣',
    type: 'novel',
    category: '科幻',
    isDirectory: true,
    totalFiles: 3,
    lastReadTime: Date.now() - 172800000,
    lastReadFileId: 'file-1',
    createdAt: Date.now() - 2592000000,
    files: [
      {
        id: 'file-1',
        title: '三体I：地球往事',
        filePath: '/path/to/threebody1.txt',
        format: 'txt',
        fileSize: 2048000,
        progress: 65,
        lastReadTime: Date.now() - 172800000,
        order: 1,
      },
      {
        id: 'file-2',
        title: '三体II：黑暗森林',
        filePath: '/path/to/threebody2.txt',
        format: 'txt',
        fileSize: 2560000,
        progress: 0,
        order: 2,
      },
      {
        id: 'file-3',
        title: '三体III：死神永生',
        filePath: '/path/to/threebody3.txt',
        format: 'txt',
        fileSize: 2304000,
        progress: 0,
        order: 3,
      },
    ],
  },
  // 目录 - 漫画系列
  {
    id: '3',
    title: '海贼王',
    author: '尾田荣一郎',
    type: 'manga',
    category: '漫画',
    isDirectory: true,
    totalFiles: 5,
    lastReadTime: Date.now() - 3600000,
    lastReadFileId: 'manga-2',
    createdAt: Date.now() - 5184000000,
    files: [
      {
        id: 'manga-1',
        title: '第1话',
        filePath: '/path/to/onepiece/001.jpg',
        format: 'jpg',
        fileSize: 512000,
        progress: 100,
        lastReadTime: Date.now() - 7200000,
        order: 1,
      },
      {
        id: 'manga-2',
        title: '第2话',
        filePath: '/path/to/onepiece/002.jpg',
        format: 'jpg',
        fileSize: 524288,
        progress: 50,
        lastReadTime: Date.now() - 3600000,
        order: 2,
      },
      {
        id: 'manga-3',
        title: '第3话',
        filePath: '/path/to/onepiece/003.jpg',
        format: 'jpg',
        fileSize: 498000,
        progress: 0,
        order: 3,
      },
      {
        id: 'manga-4',
        title: '第4话',
        filePath: '/path/to/onepiece/004.jpg',
        format: 'jpg',
        fileSize: 510000,
        progress: 0,
        order: 4,
      },
      {
        id: 'manga-5',
        title: '第5话',
        filePath: '/path/to/onepiece/005.jpg',
        format: 'jpg',
        fileSize: 505000,
        progress: 0,
        order: 5,
      },
    ],
  },
  // 单文件 - 漫画
  {
    id: '4',
    title: '进击的巨人 短篇',
    author: '谏山创',
    type: 'manga',
    category: '漫画',
    isDirectory: false,
    filePath: '/path/to/attack-titan-short.pdf',
    format: 'pdf',
    progress: 100,
    fileSize: 15360000,
    lastReadTime: Date.now() - 604800000,
    createdAt: Date.now() - 7776000000,
  },
]

/**
 * Home 页面 - 书架/图书馆视图
 */
export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('time')
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importModalConfig, setImportModalConfig] = useState<{
    title: string
    options: ModalOption[]
  }>({ title: '', options: [] })
  const [selectFilesModalOpen, setSelectFilesModalOpen] = useState(false)
  const [targetDirectory, setTargetDirectory] = useState<Book | null>(null)
  const [books, setBooks] = useState<Book[]>(mockBooks)

  // 过滤书籍
  const filteredBooks = books.filter((book) => {
    // 分类过滤
    if (selectedCategory === 'recent') {
      // 最近阅读：7天内
      const sevenDaysAgo = Date.now() - 7 * 86400000
      if (!book.lastReadTime || book.lastReadTime < sevenDaysAgo) return false
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

  // 排序书籍
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortMode) {
      case 'time':
        // 按最后阅读时间降序（最近的在前）
        return (b.lastReadTime || 0) - (a.lastReadTime || 0)
      case 'size': {
        // 按文件大小降序（大的在前）
        const aSize = a.isDirectory ? (a.totalFiles || 0) : (a.fileSize || 0)
        const bSize = b.isDirectory ? (b.totalFiles || 0) : (b.fileSize || 0)
        return bSize - aSize
      }
      case 'name':
        // 按名字字母顺序
        return a.title.localeCompare(b.title, 'zh-CN')
      default:
        return 0
    }
  })

  const handleImport = () => {
    // 主界面导入文件：创建目录 或 导入单文件
    setImportModalConfig({
      title: '导入文件',
      options: [
        {
          key: 'create-directory',
          icon: <FolderPlus size={48} />,
          title: '创建目录',
          description: '创建新目录管理文件',
          needsInput: true,
          inputLabel: '请输入目录名称：',
          inputPlaceholder: '例如：三体系列、海贼王等',
          onClick: (name) => handleCreateDirectory(name!),
        },
        {
          key: 'import-file',
          icon: <FileText size={48} />,
          title: '导入单文件',
          description: '支持 TXT、PDF、EPUB、MOBI 等格式',
          onClick: handleImportFile,
        },
      ],
    })
    setImportModalOpen(true)
  }

  const handleCreateDirectory = (name: string) => {
    // TODO: 实现创建目录功能
    console.log('Create directory:', name)
  }

  const handleImportFile = () => {
    // TODO: 实现导入单文件功能
    console.log('Import single file')
  }

  const handleQuickRead = (book: Book) => {
    // TODO: 实现目录快速阅读功能
    console.log('Quick read:', book)
  }

  const handleImportToDirectory = (book: Book) => {
    // 目录导入文件：添加已有文件 或 导入新文件
    setTargetDirectory(book)
    setImportModalConfig({
      title: `添加文件到「${book.title}」`,
      options: [
        {
          key: 'add-existing',
          icon: <FolderInput size={48} />,
          title: '添加已有文件',
          description: '从书架中选择已有的文件',
          onClick: handleAddExistingFiles,
        },
        {
          key: 'import-new',
          icon: <FilePlus size={48} />,
          title: '导入新文件',
          description: '从本地导入新的文件',
          onClick: handleImportNewFiles,
        },
      ],
    })
    setImportModalOpen(true)
  }

  const handleAddExistingFiles = () => {
    // 打开从书架选择文件的弹窗
    setSelectFilesModalOpen(true)
  }

  const handleImportNewFiles = () => {
    // TODO: 实现从本地导入新文件到目录
    console.log('Import new files to directory:', targetDirectory)
  }

  const handleSelectFiles = (selectedFileIds: string[]) => {
    if (!targetDirectory) return

    // 找到要添加的文件
    const filesToAdd = books.filter(
      (book) => selectedFileIds.includes(book.id) && !book.isDirectory
    )

    // 更新目标目录，将选中的文件添加进去
    setBooks((prevBooks) =>
      prevBooks.map((book) => {
        if (book.id === targetDirectory.id && book.isDirectory) {
          // 将单文件转换为 BookFile 格式
          const newFiles = filesToAdd.map((file, index) => ({
            id: file.id,
            title: file.title,
            filePath: file.filePath || '',
            format: file.format || '',
            fileSize: file.fileSize || 0,
            progress: file.progress || 0,
            lastReadTime: file.lastReadTime,
            order: (book.files?.length || 0) + index + 1,
          }))

          return {
            ...book,
            files: [...(book.files || []), ...newFiles],
            totalFiles: (book.totalFiles || 0) + newFiles.length,
          }
        }
        return book
      })
    )

    // 从书架中移除已添加的单文件（可选，根据需求决定）
    // 如果希望保留原文件，注释掉下面这段
    setBooks((prevBooks) =>
      prevBooks.filter((book) => !selectedFileIds.includes(book.id))
    )
  }

  // 获取可选择的单文件列表（排除目录）
  const availableSingleFiles = books.filter((book) => !book.isDirectory)

  // 排序选项配置
  const sortOptions = [
    { value: 'time' as SortMode, label: '按时间排序', icon: <Clock size={16} /> },
    { value: 'size' as SortMode, label: '按大小排序', icon: <Maximize2 size={16} /> },
    { value: 'name' as SortMode, label: '按名称排序', icon: <SortAsc size={16} /> },
  ]

  const handleSortChange = (mode: SortMode) => {
    setSortMode(mode)
    setSortPopoverOpen(false)
  }

  // 排序 Popover 内容
  const sortContent = (
    <div className={styles.sortMenu}>
      {sortOptions.map((option) => (
        <button
          key={option.value}
          className={`${styles.sortMenuItem} ${sortMode === option.value ? styles.active : ''}`}
          onClick={() => handleSortChange(option.value)}
        >
          <span className={styles.sortMenuIcon}>{option.icon}</span>
          <span className={styles.sortMenuLabel}>{option.label}</span>
        </button>
      ))}
    </div>
  )

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

            <Popover
              content={sortContent}
              trigger="click"
              open={sortPopoverOpen}
              onOpenChange={setSortPopoverOpen}
              placement="bottomRight"
            >
              <button
                className={`${styles.viewButton} ${sortPopoverOpen ? styles.active : ''}`}
                aria-label="排序"
                title="排序"
              >
                <ArrowUpDown size={20} />
              </button>
            </Popover>

            <Button icon={<Plus size={20} />} onClick={handleImport}>
              导入文件
            </Button>
          </div>
        </header>

        <div className={styles.content}>
          {sortedBooks.length > 0 ? (
            <div className={`${styles.booksList} ${styles[viewMode]}`}>
              {sortedBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  viewMode={viewMode}
                  onOpen={handleOpenBook}
                  onEdit={handleEditBook}
                  onDelete={handleDeleteBook}
                  onQuickRead={handleQuickRead}
                  onImportToDirectory={handleImportToDirectory}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyText}>
                {searchQuery ? '没有找到匹配的书籍' : '还没有书籍，点击导入文件按钮添加'}
              </p>
            </div>
          )}
        </div>
      </main>

      <ImportModal
        open={importModalOpen}
        title={importModalConfig.title}
        options={importModalConfig.options}
        onClose={() => setImportModalOpen(false)}
      />

      <SelectFilesModal
        open={selectFilesModalOpen}
        onClose={() => setSelectFilesModalOpen(false)}
        onConfirm={handleSelectFiles}
        availableFiles={availableSingleFiles}
        targetDirectoryName={targetDirectory?.title || ''}
      />
    </div>
  )
}
