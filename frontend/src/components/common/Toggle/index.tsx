import styles from './Toggle.module.scss'

export interface ToggleProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  checkedLabel?: string
  uncheckedLabel?: string
  className?: string
}

/**
 * Toggle 开关组件
 * 用于替代零散的第三方开关，统一交互反馈和主题样式。
 */
export default function Toggle({
  checked,
  onChange,
  disabled = false,
  checkedLabel = '已开启',
  uncheckedLabel = '已关闭',
  className = '',
}: ToggleProps) {
  const buttonClassName = [
    styles.toggle,
    checked ? styles.checked : '',
    disabled ? styles.disabled : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={buttonClassName}
      onClick={() => {
        if (!disabled) {
          onChange?.(!checked)
        }
      }}
      disabled={disabled}
    >
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
      <span className={styles.label}>{checked ? checkedLabel : uncheckedLabel}</span>
    </button>
  )
}
