import { useState } from 'react'
import { Modal, Checkbox } from 'antd'
import { BookOpen } from 'lucide-react'
import type { Book } from '@/types'
import styles from './SelectFilesModal.module.scss'

export interface SelectFilesModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (selectedFileIds: string[]) => void
  availableFiles: Book[] // 可选择的单文件列表
  targetDirectoryName: string // 目标目录名称
}

/**
 * SelectFilesModal 选择文件弹窗
 * 用于从已有单文件中选择，添加到目录
 */
export default function SelectFilesModal({
  open,
  onClose,
  onConfirm,
  availableFiles,
  targetDirectoryName,
}: SelectFilesModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleToggle = (fileId: string) => {
    setSelectedIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === availableFiles.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(availableFiles.map((file) => file.id))
    }
  }

  const handleConfirm = () => {
    onConfirm(selectedIds)
    setSelectedIds([])
    onClose()
  }

  const handleCancel = () => {
    setSelectedIds([])
    onClose()
  }

  return (
    <Modal
      title={`添加文件到「${targetDirectoryName}」`}
      open={open}
      onCancel={handleCancel}
      onOk={handleConfirm}
      okText="确定添加"
      cancelText="取消"
      width={600}
      centered
      okButtonProps={{ disabled: selectedIds.length === 0 }}
    >
      {availableFiles.length > 0 ? (
        <>
          <div className={styles.header}>
            <Checkbox
              checked={selectedIds.length === availableFiles.length}
              indeterminate={
                selectedIds.length > 0 && selectedIds.length < availableFiles.length
              }
              onChange={handleSelectAll}
            >
              全选 ({selectedIds.length}/{availableFiles.length})
            </Checkbox>
          </div>

          <div className={styles.fileList}>
            {availableFiles.map((file) => (
              <div
                key={file.id}
                className={`${styles.fileItem} ${
                  selectedIds.includes(file.id) ? styles.selected : ''
                }`}
                onClick={() => handleToggle(file.id)}
              >
                <Checkbox
                  checked={selectedIds.includes(file.id)}
                  onChange={() => handleToggle(file.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className={styles.fileIcon}>
                  {file.cover ? (
                    <img src={file.cover} alt={file.title} />
                  ) : (
                    <BookOpen size={32} />
                  )}
                </div>
                <div className={styles.fileInfo}>
                  <h4 className={styles.fileTitle}>{file.title}</h4>
                  <p className={styles.fileAuthor}>作者: {file.author}</p>
                  <p className={styles.fileMeta}>
                    {file.format?.toUpperCase()} · {file.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.empty}>
          <p>暂无可添加的单文件</p>
        </div>
      )}
    </Modal>
  )
}
