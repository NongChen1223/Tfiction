import { useState } from 'react'
import Dialog from '@/components/common/Dialog'
import styles from './ConfirmModal.module.scss'

export interface ConfirmModalProps {
  open: boolean
  title: string
  detail?: string
  description?: string
  confirmText?: string
  cancelText?: string
  tone?: 'danger' | 'primary'
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

/**
 * ConfirmModal 统一确认弹窗
 * 用于删除等需要二次确认的轻量流程。
 */
export default function ConfirmModal({
  open,
  title,
  detail,
  description,
  confirmText = '确定',
  cancelText = '取消',
  tone = 'primary',
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const confirmButtonClassName =
    tone === 'danger' ? styles.confirmButtonDanger : styles.confirmButtonPrimary

  const handleConfirm = async () => {
    if (submitting) {
      return
    }

    try {
      setSubmitting(true)
      await onConfirm()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? () => undefined : onClose}
      width={420}
      showCloseButton={false}
      variant="brutal"
    >
      <div className={styles.content}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>删除确认</span>
          <h3 className={styles.title}>{title}</h3>
          {description && <p className={styles.description}>{description}</p>}
        </div>

        {detail && <div className={styles.detail}>{detail}</div>}

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.cancelButton}`}
            onClick={onClose}
            disabled={submitting}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${confirmButtonClassName}`}
            onClick={() => void handleConfirm()}
            disabled={submitting}
          >
            {submitting ? '处理中...' : confirmText}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
