import styles from './ColorField.module.scss'

export interface ColorFieldProps {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  helperText?: string
  className?: string
}

function normalizeColorValue(value: string) {
  return /^#([0-9a-fA-F]{6})$/.test(value) ? value.toUpperCase() : '#FFFFFF'
}

/**
 * ColorField 颜色选择组件
 * 统一项目内颜色选择的视觉和交互，只暴露标准十六进制值。
 */
export default function ColorField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  helperText,
  className = '',
}: ColorFieldProps) {
  const normalizedValue = normalizeColorValue(value)

  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}

      <label
        className={[styles.picker, disabled ? styles.disabled : '']
          .filter(Boolean)
          .join(' ')}
        htmlFor={id}
      >
        <span
          className={styles.swatch}
          style={{ backgroundColor: normalizedValue }}
          aria-hidden="true"
        />
        <span className={styles.value}>{normalizedValue}</span>
        <span className={styles.caption}>点击换色</span>
        <input
          id={id}
          type="color"
          className={styles.input}
          value={normalizedValue}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          disabled={disabled}
        />
      </label>

      {helperText && <p className={styles.helperText}>{helperText}</p>}
    </div>
  )
}
