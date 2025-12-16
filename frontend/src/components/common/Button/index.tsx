import { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.scss'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  children?: ReactNode
}

/**
 * Button 通用按钮组件
 * 支持多种样式变体和尺寸
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classNames} disabled={disabled} {...props}>
      {icon && iconPosition === 'left' && <span className={styles.icon}>{icon}</span>}
      {children && <span className={styles.content}>{children}</span>}
      {icon && iconPosition === 'right' && <span className={styles.icon}>{icon}</span>}
    </button>
  )
}
