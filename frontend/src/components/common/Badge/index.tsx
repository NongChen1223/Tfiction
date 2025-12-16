import { ReactNode } from 'react'
import styles from './Badge.module.scss'

export interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  className?: string
}

/**
 * Badge 徽章组件
 * 用于分类标签、状态指示等
 */
export default function Badge({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  const classNames = [styles.badge, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ')

  return <span className={classNames}>{children}</span>
}
