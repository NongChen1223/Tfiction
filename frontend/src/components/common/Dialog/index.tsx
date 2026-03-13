import { useEffect, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import styles from './Dialog.module.scss'

export interface DialogProps {
  open: boolean
  title?: ReactNode
  subtitle?: ReactNode
  width?: number | string
  footer?: ReactNode
  children: ReactNode
  onClose: () => void
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  variant?: 'default' | 'brutal'
}

/**
 * Dialog 通用弹窗基座
 * 统一处理遮罩、Esc 关闭和页面级浮层样式。
 */
export default function Dialog({
  open,
  title,
  subtitle,
  width = 520,
  footer,
  children,
  onClose,
  showCloseButton = true,
  closeOnBackdrop = true,
  variant = 'default',
}: DialogProps) {
  const hasHeader = Boolean(title || subtitle || showCloseButton)

  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return
    }

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') {
    return null
  }

  const style = {
    '--dialog-width': typeof width === 'number' ? `${width}px` : width,
  } as CSSProperties

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop || event.target !== event.currentTarget) {
      return
    }

    onClose()
  }

  return createPortal(
    <div
      className={[styles.overlay, variant === 'brutal' ? styles.overlayBrutal : '']
        .filter(Boolean)
        .join(' ')}
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <div
        className={[styles.dialog, variant === 'brutal' ? styles.dialogBrutal : '']
          .filter(Boolean)
          .join(' ')}
        style={style}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {hasHeader && (
          <header className={styles.header}>
            <div className={styles.headerCopy}>
              {title && <div className={styles.title}>{title}</div>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {showCloseButton && (
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="关闭弹窗"
              >
                <X size={18} />
              </button>
            )}
          </header>
        )}

        <div
          className={[
            styles.body,
            !hasHeader ? styles.bodyWithoutHeader : '',
            variant === 'brutal' ? styles.bodyBrutal : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {children}
        </div>

        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body
  )
}
