import type { Book, ViewMode } from '@/types'
import { BookOpen, Eye, EyeOff, Edit2, Trash2, FolderOpen, Plus } from 'lucide-react'
import Badge from '@/components/common/Badge'
import styles from './BookCard.module.scss'

export interface BookCardProps {
  book: Book
  viewMode?: ViewMode
  onOpen?: (book: Book) => void
  onEdit?: (book: Book) => void
  onDelete?: (book: Book) => void
  onQuickRead?: (book: Book) => void // 目录快速阅读
  onImportToDirectory?: (book: Book) => void // 导入文件到目录
}

/**
 * BookCard 书籍卡片组件
 * 支持网格和列表两种展示模式
 * 支持单文件和目录两种类型
 */
export default function BookCard({
  book,
  viewMode = 'grid',
  onOpen,
  onEdit,
  onDelete,
  onQuickRead,
  onImportToDirectory,
}: BookCardProps) {
  const handleOpen = () => onOpen?.(book)
  const handleBossMode = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: 实现老板模式
    console.log('Boss mode:', book)
  }
  const handleQuickRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    onQuickRead?.(book)
  }
  const handleImportToDirectory = (e: React.MouseEvent) => {
    e.stopPropagation()
    onImportToDirectory?.(book)
  }
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(book)
  }
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(book)
  }

  const cardClasses = [styles.card, styles[viewMode]].filter(Boolean).join(' ')

  // 列表模式的渲染
  if (viewMode === 'list') {
    return (
      <div className={cardClasses}>
        <div className={styles.coverWrapper}>
          <div className={styles.cover}>
            {book.cover ? (
              <img src={book.cover} alt={book.title} className={styles.coverImage} />
            ) : (
              <div className={styles.coverPlaceholder}>
                <BookOpen size={48} />
              </div>
            )}
          </div>
        </div>

        <div className={styles.listContent}>
          <div className={styles.listInfo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <div className={styles.tagWrapper}>
                <Badge variant="primary" size="sm">
                  {book.category}
                </Badge>
              </div>
            </div>
            <div className={styles.titleOverlay}>
              <h3 className={styles.title}>{book.title}</h3>
              <p className={styles.author}>作者: {book.author}</p>
            </div>
            <div className={styles.listProgressBar}>
              <div className={styles.listProgressTrack}>
                <div
                  className={styles.listProgressFill}
                  style={{ width: `${book.progress}%` }}
                />
              </div>
              <span className={styles.listProgressText}>{book.progress}%</span>
            </div>
          </div>

          <div className={styles.footer}>
            {book.lastReadTime && (
              <p className={styles.lastRead}>
                最后阅读: {new Date(book.lastReadTime).toLocaleDateString()}
              </p>
            )}
            <div className={styles.actions}>
              <button
                className={styles.iconButton}
                onClick={handleOpen}
                aria-label="阅读"
                title="阅读"
              >
                <Eye size={16} />
              </button>
              <button
                className={styles.iconButton}
                onClick={handleEdit}
                aria-label="编辑"
                title="编辑"
              >
                <Edit2 size={16} />
              </button>
              <button
                className={styles.iconButton}
                onClick={handleDelete}
                aria-label="删除"
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 网格模式的渲染
  return (
    <div className={cardClasses}>
      <div className={styles.coverWrapper}>
        <div className={styles.cover}>
          {book.cover ? (
            <img src={book.cover} alt={book.title} className={styles.coverImage} />
          ) : (
            <div className={styles.coverPlaceholder}>
              {book.isDirectory ? <FolderOpen size={48} /> : <BookOpen size={48} />}
            </div>
          )}

          {/* 圆形进度条 - 左上角 - 仅单文件显示 */}
          {!book.isDirectory && book.progress !== undefined && (
            <div className={styles.progressCircle}>
              <svg className={styles.progressSvg} viewBox="0 0 36 36">
                <circle
                  className={styles.progressBg}
                  cx="18"
                  cy="18"
                  r="16"
                />
                <circle
                  className={styles.progressBar}
                  cx="18"
                  cy="18"
                  r="16"
                  strokeDasharray={`${book.progress}, 100`}
                />
              </svg>
              <span className={styles.progressText}>{book.progress}%</span>
            </div>
          )}

          {/* Tag标签 - 封面内 */}
          <div className={styles.tagWrapper}>
            <Badge variant="primary" size="sm">
              {book.isDirectory ? `${book.totalFiles || 0} 个文件` : book.category}
            </Badge>
          </div>

          {/* 标题 - 封面底部 */}
          <div className={styles.titleOverlay}>
            <h3 className={styles.title}>{book.title}</h3>
            <p className={styles.author}>作者: {book.author}</p>
          </div>

          {/* 悬浮显示的操作按钮 - 根据类型不同 */}
          <div className={styles.hoverActions}>
            {book.isDirectory ? (
              // 目录类型：立即阅读 + 导入文件
              <>
                <button className={styles.actionButton} onClick={handleQuickRead}>
                  <Eye size={20} />
                  <span>立即阅读</span>
                </button>
                <button className={styles.actionButton} onClick={handleImportToDirectory}>
                  <Plus size={20} />
                  <span>导入文件</span>
                </button>
              </>
            ) : (
              // 单文件类型：立刻阅读 + 老板模式
              <>
                <button className={styles.actionButton} onClick={handleOpen}>
                  <Eye size={20} />
                  <span>立刻阅读</span>
                </button>
                <button className={styles.actionButton} onClick={handleBossMode}>
                  <EyeOff size={20} />
                  <span>老板模式</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 底部信息栏 - 最后阅读时间和操作按钮 */}
      <div className={styles.footer}>
        {book.lastReadTime && (
          <p className={styles.lastRead}>
            最后阅读: {new Date(book.lastReadTime).toLocaleDateString()}
          </p>
        )}
        <div className={styles.actions}>
          <button
            className={styles.iconButton}
            onClick={handleEdit}
            aria-label="编辑"
            title="编辑"
          >
            <Edit2 size={16} />
          </button>
          <button
            className={styles.iconButton}
            onClick={handleDelete}
            aria-label="删除"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
