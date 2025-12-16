import { InputHTMLAttributes, ReactNode, forwardRef } from 'react'
import { X } from 'lucide-react'
import styles from './Input.module.scss'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  onClear?: () => void
  error?: string
  fullWidth?: boolean
}

/**
 * Input 输入框组件
 * 支持图标、清除按钮、错误提示
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, onClear, error, fullWidth = false, className = '', ...props }, ref) => {
    const containerClasses = [
      styles.container,
      fullWidth && styles.fullWidth,
      error && styles.error,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={containerClasses}>
        <div className={styles.inputWrapper}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <input ref={ref} className={styles.input} {...props} />
          {onClear && props.value && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={onClear}
              aria-label="清除输入"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
