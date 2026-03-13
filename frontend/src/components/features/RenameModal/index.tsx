import { useEffect, useMemo, useRef, useState } from 'react'
import { FolderPen, PencilLine } from 'lucide-react'
import Button from '@/components/common/Button'
import Dialog from '@/components/common/Dialog'
import Input from '@/components/common/Input'
import styles from './RenameModal.module.scss'

export interface RenameModalProps {
  open: boolean
  title: string
  description: string
  currentName: string
  placeholder?: string
  onClose: () => void
  onConfirm: (value: string) => void
}

/**
 * RenameModal 命名编辑弹窗
 * 统一目录和书籍的重命名输入、校验和预览反馈。
 */
export default function RenameModal({
  open,
  title,
  description,
  currentName,
  placeholder = '请输入新名称',
  onClose,
  onConfirm,
}: RenameModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(currentName)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setValue(currentName)
    setError('')
  }, [currentName, open])

  useEffect(() => {
    if (!open) {
      return
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 20)

    return () => window.clearTimeout(timer)
  }, [open])

  const trimmedValue = value.trim()
  const canSubmit = trimmedValue.length > 0 && trimmedValue !== currentName.trim()
  const currentIcon = useMemo(
    () => (title.includes('目录') ? <FolderPen size={22} /> : <PencilLine size={22} />),
    [title]
  )

  const handleConfirm = () => {
    if (!trimmedValue) {
      setError('名称不能为空')
      return
    }

    if (trimmedValue === currentName.trim()) {
      setError('名称还没有变化')
      return
    }

    onConfirm(trimmedValue)
    setError('')
  }

  const handleClose = () => {
    setValue(currentName)
    setError('')
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      width={460}
      variant="brutal"
      showCloseButton={false}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.iconBadge}>{currentIcon}</div>
          <div className={styles.copy}>
            <span className={styles.eyebrow}>重命名</span>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
          </div>
        </div>

        <div className={styles.form}>
          <label className={styles.label} htmlFor="rename-input">
            新名称
          </label>
          <Input
            ref={inputRef}
            fullWidth
            id="rename-input"
            value={value}
            placeholder={placeholder}
            error={error}
            maxLength={80}
            onChange={(event) => {
              setValue(event.target.value)
              if (error) {
                setError('')
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleConfirm()
              }
            }}
          />
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleClose}>
            取消
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!canSubmit}>
            确认保存
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
