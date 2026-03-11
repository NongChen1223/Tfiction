import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Grid,
  List,
  Plus,
  ArrowUpDown,
  Clock,
  Maximize2,
  SortAsc,
  FolderPlus,
  FileText,
  FolderInput,
  FilePlus,
} from 'lucide-react'
import { Popover } from 'antd'
import { OpenNovel } from '@/wailsjs/go/services/NovelService'
import type { Book, SortMode, ViewMode } from '@/types'
import Sidebar from '@/components/features/Sidebar'
import BookCard from '@/components/features/BookCard'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import ImportModal, { type ModalOption } from '@/components/features/ImportModal'
import SelectFilesModal from '@/components/features/SelectFilesModal'
import { useNovelStore } from '@/stores/novelStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { mapNovelToBook, normalizeNovel } from '@/utils/novel'
import styles from './Home.module.scss'

function isPickerCancelled(error: unknown) {
  return error instanceof Error && error.message.includes('未选择文件')
}

/**
 * Home 页面 - 书架/图书馆视图
 */
export default function Home() {
  const navigate = useNavigate()
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
  const { setCurrentNovel, addNovel } = useNovelStore()
  const {
    books,
    upsertBook,
    createDirectory,
    renameBook,
    removeBook,
    moveBooksToDirectory,
    addImportedFileToDirectory,
  } = useLibraryStore()

  const filteredBooks = books.filter((book) => {
    if (selectedCategory === 'recent') {
      const sevenDaysAgo = Date.now() - 7 * 86400000
      if (!book.lastReadTime || book.lastReadTime < sevenDaysAgo) {
        return false
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      )
    }

    return true
  })

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortMode) {
      case 'time':
        return (b.lastReadTime || 0) - (a.lastReadTime || 0)
      case 'size': {
        const aSize = a.isDirectory ? a.totalFiles || 0 : a.fileSize || 0
        const bSize = b.isDirectory ? b.totalFiles || 0 : b.fileSize || 0
        return bSize - aSize
      }
      case 'name':
        return a.title.localeCompare(b.title, 'zh-CN')
      default:
        return 0
    }
  })

  const availableSingleFiles = books.filter((book) => !book.isDirectory)

  const sortOptions = [
    { value: 'time' as SortMode, label: '按时间排序', icon: <Clock size={16} /> },
    { value: 'size' as SortMode, label: '按大小排序', icon: <Maximize2 size={16} /> },
    { value: 'name' as SortMode, label: '按名称排序', icon: <SortAsc size={16} /> },
  ]

  const sortContent = (
    <div className={styles.sortMenu}>
      {sortOptions.map((option) => (
        <button
          key={option.value}
          className={`${styles.sortMenuItem} ${sortMode === option.value ? styles.active : ''}`}
          onClick={() => {
            setSortMode(option.value)
            setSortPopoverOpen(false)
          }}
        >
          <span className={styles.sortMenuIcon}>{option.icon}</span>
          <span className={styles.sortMenuLabel}>{option.label}</span>
        </button>
      ))}
    </div>
  )

  const openNovelAndEnterReader = async (filePath = '') => {
    const existingBook = books.find((book) => book.filePath === filePath)
    const openedNovel = await OpenNovel(filePath)
    const normalizedNovel = normalizeNovel(openedNovel)
    const shelfBook = mapNovelToBook(normalizedNovel, existingBook)

    setCurrentNovel(normalizedNovel)
    addNovel(normalizedNovel)
    upsertBook(shelfBook)
    navigate('/reader')

    return shelfBook
  }

  const handleImport = () => {
    setImportModalConfig({
      title: '导入文件',
      options: [
        {
          key: 'create-directory',
          icon: <FolderPlus size={48} />,
          title: '创建目录',
          description: '创建新目录管理系列作品',
          needsInput: true,
          inputLabel: '请输入目录名称：',
          inputPlaceholder: '例如：三体系列、海贼王等',
          onClick: (name) => handleCreateDirectory(name || ''),
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
    const trimmedName = name.trim()
    if (!trimmedName) {
      return
    }

    createDirectory(trimmedName)
  }

  const handleImportFile = async () => {
    try {
      await openNovelAndEnterReader()
    } catch (error) {
      if (!isPickerCancelled(error)) {
        console.error('导入文件失败:', error)
      }
    }
  }

  const handleQuickRead = async (book: Book) => {
    const targetFile =
      book.files?.find((file) => file.id === book.lastReadFileId) || book.files?.[0]
    if (!targetFile?.filePath) {
      window.alert('当前目录还没有可阅读的文件')
      return
    }

    try {
      await openNovelAndEnterReader(targetFile.filePath)
    } catch (error) {
      console.error('打开目录失败:', error)
    }
  }

  const handleImportToDirectory = (book: Book) => {
    setTargetDirectory(book)
    setImportModalConfig({
      title: `添加文件到「${book.title}」`,
      options: [
        {
          key: 'add-existing',
          icon: <FolderInput size={48} />,
          title: '添加已有文件',
          description: '从书架中选择已有的文件',
          onClick: () => setSelectFilesModalOpen(true),
        },
        {
          key: 'import-new',
          icon: <FilePlus size={48} />,
          title: '导入新文件',
          description: '从本地直接导入到目录',
          onClick: handleImportNewFiles,
        },
      ],
    })
    setImportModalOpen(true)
  }

  const handleImportNewFiles = async () => {
    if (!targetDirectory) {
      return
    }

    try {
      const importedBook = await openNovelAndEnterReader()
      addImportedFileToDirectory(targetDirectory.id, importedBook)
      removeBook(importedBook.id)
    } catch (error) {
      if (!isPickerCancelled(error)) {
        console.error('导入目录文件失败:', error)
      }
    }
  }

  const handleSelectFiles = (selectedFileIds: string[]) => {
    if (!targetDirectory || selectedFileIds.length === 0) {
      return
    }

    moveBooksToDirectory(targetDirectory.id, selectedFileIds)
  }

  const handleOpenBook = async (book: Book) => {
    if (book.isDirectory) {
      await handleQuickRead(book)
      return
    }

    if (!book.filePath) {
      return
    }

    try {
      await openNovelAndEnterReader(book.filePath)
    } catch (error) {
      console.error('打开书籍失败:', error)
    }
  }

  const handleEditBook = (book: Book) => {
    const nextTitle = window.prompt('请输入新的书名', book.title)
    if (!nextTitle) {
      return
    }

    renameBook(book.id, nextTitle)
  }

  const handleDeleteBook = (book: Book) => {
    const confirmed = window.confirm(`确认删除「${book.title}」吗？`)
    if (!confirmed) {
      return
    }

    removeBook(book.id)
  }

  return (
    <div className={styles.container}>
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <main className={styles.main}>
        <header className={styles.header}>
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
                {searchQuery ? '没有找到匹配的书籍' : '书架还是空的，先导入一本小说试试'}
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
