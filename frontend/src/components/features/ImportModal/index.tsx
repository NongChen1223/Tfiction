import { useState } from 'react'
import { Modal, Input } from 'antd'
import { FolderPlus, FileText } from 'lucide-react'
import styles from './ImportModal.module.scss'

export interface ImportModalProps {
  open: boolean
  onClose: () => void
  onCreateDirectory: (name: string) => void
  onImportFile: () => void
}

/**
 * ImportModal 导入文件弹窗
 * 提供两个选项：创建目录 和 导入单文件
 */
export default function ImportModal({
  open,
  onClose,
  onCreateDirectory,
  onImportFile,
}: ImportModalProps) {
  const [showNameInput, setShowNameInput] = useState(false)
  const [directoryName, setDirectoryName] = useState('')

  const handleCreateDirectory = () => {
    setShowNameInput(true)
  }

  const handleConfirmCreate = () => {
    if (directoryName.trim()) {
      onCreateDirectory(directoryName.trim())
      setDirectoryName('')
      setShowNameInput(false)
      onClose()
    }
  }

  const handleImportFile = () => {
    onImportFile()
    onClose()
  }

  const handleCancel = () => {
    setShowNameInput(false)
    setDirectoryName('')
    onClose()
  }

  return (
    <Modal
      title="导入文件"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={480}
      centered
    >
      {!showNameInput ? (
        <div className={styles.options}>
          <button className={styles.optionCard} onClick={handleCreateDirectory}>
            <div className={styles.iconWrapper}>
              <FolderPlus size={48} />
            </div>
            <h3 className={styles.optionTitle}>创建目录</h3>
            <p className={styles.optionDesc}>创建新目录管理文件</p>
          </button>

          <button className={styles.optionCard} onClick={handleImportFile}>
            <div className={styles.iconWrapper}>
              <FileText size={48} />
            </div>
            <h3 className={styles.optionTitle}>导入单文件</h3>
            <p className={styles.optionDesc}>支持 TXT、PDF、EPUB、MOBI 等格式</p>
          </button>
        </div>
      ) : (
        <div className={styles.nameInput}>
          <p className={styles.inputLabel}>请输入目录名称：</p>
          <Input
            placeholder="例如：三体系列、海贼王等"
            value={directoryName}
            onChange={(e) => setDirectoryName(e.target.value)}
            onPressEnter={handleConfirmCreate}
            autoFocus
            size="large"
          />
          <div className={styles.buttonGroup}>
            <button
              className={styles.cancelButton}
              onClick={() => setShowNameInput(false)}
            >
              取消
            </button>
            <button
              className={styles.confirmButton}
              onClick={handleConfirmCreate}
              disabled={!directoryName.trim()}
            >
              确定创建
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
