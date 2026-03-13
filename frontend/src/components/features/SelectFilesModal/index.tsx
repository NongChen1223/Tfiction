import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Check, Minus, FolderPlus } from 'lucide-react'
import Button from '@/components/common/Button'
import Dialog from '@/components/common/Dialog'
import type { Book } from '@/types'
import styles from './SelectFilesModal.module.scss'

export interface SelectFilesModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (selectedFileIds: string[]) => void
  availableFiles: Book[]
  targetDirectoryName: string
}

/**
 * SelectFilesModal 选择文件弹窗
 * 用于从书架中挑选已有单文件，批量加入目标目录。
 */
export default function SelectFilesModal({
  open,
  onClose,
  onConfirm,
  availableFiles,
  targetDirectoryName,
}: SelectFilesModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (!open) {
      setSelectedIds([])
    }
  }, [open, targetDirectoryName])

  const selectedCount = selectedIds.length
  const allSelected = availableFiles.length > 0 && selectedCount === availableFiles.length
  const isPartiallySelected = selectedCount > 0 && selectedCount < availableFiles.length

  const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const handleToggle = (fileId: string) => {
    setSelectedIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    )
  }

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
      return
    }

    setSelectedIds(availableFiles.map((file) => file.id))
  }

  const handleConfirm = () => {
    if (selectedIds.length === 0) {
      return
    }

    onConfirm(selectedIds)
    setSelectedIds([])
    onClose()
  }

  const handleCancel = () => {
    setSelectedIds([])
    onClose()
  }

  const footer =
    availableFiles.length > 0 ? (
      <>
        <Button variant="secondary" onClick={handleCancel}>
          取消
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={selectedIds.length === 0}>
          确定添加
        </Button>
      </>
    ) : (
      <Button variant="secondary" onClick={handleCancel}>
        我知道了
      </Button>
    )

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      title={`添加文件到「${targetDirectoryName}」`}
      subtitle="从当前书架挑选已有书籍，确认后会直接放进这个目录。"
      width={680}
      footer={footer}
      variant="brutal"
    >
      {availableFiles.length > 0 ? (
        <div className={styles.content}>
          <div className={styles.toolbar}>
            <button
              type="button"
              className={`${styles.selectAllButton} ${allSelected ? styles.selectAllActive : ''}`}
              onClick={handleSelectAll}
            >
              <span
                className={`${styles.checkbox} ${
                  allSelected || isPartiallySelected ? styles.checkboxChecked : ''
                }`}
                aria-hidden="true"
              >
                {allSelected ? <Check size={14} /> : isPartiallySelected ? <Minus size={14} /> : null}
              </span>
              <span className={styles.selectAllText}>全选文件</span>
              <span className={styles.counter}>
                {selectedCount}/{availableFiles.length}
              </span>
            </button>
          </div>

          <div className={styles.fileList}>
            {availableFiles.map((file) => {
              const isSelected = selectedIdsSet.has(file.id)

              return (
                <button
                  type="button"
                  key={file.id}
                  className={`${styles.fileItem} ${isSelected ? styles.fileItemSelected : ''}`}
                  onClick={() => handleToggle(file.id)}
                  aria-pressed={isSelected}
                >
                  <span
                    className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}
                    aria-hidden="true"
                  >
                    {isSelected ? <Check size={14} /> : null}
                  </span>

                  <div className={styles.fileIcon}>
                    {file.cover ? (
                      <img src={file.cover} alt={file.title} />
                    ) : (
                      <BookOpen size={28} />
                    )}
                  </div>

                  <div className={styles.fileInfo}>
                    <h4 className={styles.fileTitle}>{file.title}</h4>
                    <p className={styles.fileAuthor}>作者：{file.author || '未知作者'}</p>
                    <p className={styles.fileMeta}>
                      {(file.format || 'unknown').toUpperCase()}
                      {file.category ? ` · ${file.category}` : ''}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <FolderPlus size={24} />
          </div>
          <p className={styles.emptyTitle}>当前没有可添加的单文件</p>
          <p className={styles.emptyDescription}>先导入几本书，或者把目录里的书移回书架后再试。</p>
        </div>
      )}
    </Dialog>
  )
}
