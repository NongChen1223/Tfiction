import { FilePlus, FolderInput } from 'lucide-react'
import { Modal } from 'antd'
import styles from './AddToDirectoryModal.module.scss'

export interface AddToDirectoryModalProps {
  open: boolean
  onClose: () => void
  onAddExisting: () => void
  onImportNew: () => void
  directoryName: string
}

/**
 * AddToDirectoryModal 添加文件到目录弹窗
 * 提供两个选项：添加已有文件 和 导入新文件
 */
export default function AddToDirectoryModal({
  open,
  onClose,
  onAddExisting,
  onImportNew,
  directoryName,
}: AddToDirectoryModalProps) {
  const handleAddExisting = () => {
    onAddExisting()
    onClose()
  }

  const handleImportNew = () => {
    onImportNew()
    onClose()
  }

  return (
    <Modal
      title={`添加文件到「${directoryName}」`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      centered
    >
      <div className={styles.options}>
        <button className={styles.optionCard} onClick={handleAddExisting}>
          <div className={styles.iconWrapper}>
            <FolderInput size={48} />
          </div>
          <h3 className={styles.optionTitle}>添加已有文件</h3>
          <p className={styles.optionDesc}>从书架中选择已有的文件</p>
        </button>

        <button className={styles.optionCard} onClick={handleImportNew}>
          <div className={styles.iconWrapper}>
            <FilePlus size={48} />
          </div>
          <h3 className={styles.optionTitle}>导入新文件</h3>
          <p className={styles.optionDesc}>从本地导入新的文件</p>
        </button>
      </div>
    </Modal>
  )
}
