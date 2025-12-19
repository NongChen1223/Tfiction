import { useState } from 'react'
import { Modal, Input } from 'antd'
import type { LucideIcon } from 'lucide-react'
import styles from './ImportModal.module.scss'

export interface ModalOption {
  key: string
  icon: React.ReactElement
  title: string
  description: string
  onClick: (inputValue?: string) => void // 支持传入输入值
  needsInput?: boolean // 是否需要输入（如创建目录需要输入名称）
  inputPlaceholder?: string // 输入框提示文本
  inputLabel?: string // 输入框标签
}

export interface ImportModalProps {
  open: boolean
  title: string
  options: ModalOption[]
  onClose: () => void
}

/**
 * ImportModal 通用选择弹窗
 * 支持显示多个选项卡片，可配置是否需要输入
 */
export default function ImportModal({
  open,
  title,
  options,
  onClose,
}: ImportModalProps) {
  const [showInput, setShowInput] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [currentOption, setCurrentOption] = useState<ModalOption | null>(null)

  const handleOptionClick = (option: ModalOption) => {
    if (option.needsInput) {
      setCurrentOption(option)
      setShowInput(true)
    } else {
      option.onClick()
      onClose()
    }
  }

  const handleConfirm = () => {
    if (currentOption && inputValue.trim()) {
      currentOption.onClick(inputValue.trim())
      setInputValue('')
      setShowInput(false)
      setCurrentOption(null)
      onClose()
    }
  }

  const handleCancel = () => {
    setShowInput(false)
    setInputValue('')
    setCurrentOption(null)
    onClose()
  }

  const handleBack = () => {
    setShowInput(false)
    setInputValue('')
    setCurrentOption(null)
  }

  return (
    <Modal
      title={title}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={480}
      centered
    >
      {!showInput ? (
        <div className={styles.options}>
          {options.map((option) => (
            <button
              key={option.key}
              className={styles.optionCard}
              onClick={() => handleOptionClick(option)}
            >
              <div className={styles.iconWrapper}>{option.icon}</div>
              <h3 className={styles.optionTitle}>{option.title}</h3>
              <p className={styles.optionDesc}>{option.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.nameInput}>
          <p className={styles.inputLabel}>
            {currentOption?.inputLabel || '请输入目录名称：'}
          </p>
          <Input
            placeholder={currentOption?.inputPlaceholder || '例如：三体系列、海贼王等'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleConfirm}
            autoFocus
            size="large"
          />
          <div className={styles.buttonGroup}>
            <button className={styles.cancelButton} onClick={handleBack}>
              取消
            </button>
            <button
              className={styles.confirmButton}
              onClick={handleConfirm}
              disabled={!inputValue.trim()}
            >
              确定创建
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
