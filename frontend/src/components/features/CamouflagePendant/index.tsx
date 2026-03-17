import type { ButtonHTMLAttributes } from 'react'
import styles from './CamouflagePendant.module.scss'

interface CamouflagePendantProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'default' | 'preview'
  title?: string
  subtitle?: string
  dragging?: boolean
}

/**
 * 收纳伪装挂件。
 * 视觉上模拟一个小型动态贴纸，在阅读页和设置演示中复用。
 */
export default function CamouflagePendant({
  variant = 'default',
  title = '伪装中',
  subtitle = '双击展开阅读框',
  dragging = false,
  className = '',
  ...props
}: CamouflagePendantProps) {
  const pendantClassName = [
    styles.pendant,
    variant === 'preview' ? styles.preview : '',
    dragging ? styles.dragging : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={pendantClassName} {...props}>
      <span className={styles.pin} aria-hidden="true" />
      <span className={styles.badge}>GIF</span>
      <span className={styles.mediaCard} aria-hidden="true">
        <span className={styles.playIcon} />
        <span className={styles.signalDot} />
      </span>
      <span className={styles.copy}>
        <span className={styles.title}>{title}</span>
        <span className={styles.subtitle}>{subtitle}</span>
        <span className={styles.accentLine} aria-hidden="true" />
      </span>
    </button>
  )
}
