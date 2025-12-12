import styles from './Slider.module.css'

export interface SliderProps {
  label?: string
  min?: number
  max?: number
  step?: number
  value?: number
  onChange?: (value: number) => void
  showValue?: boolean
  unit?: string
  disabled?: boolean
  className?: string
}

/**
 * Slider 滑块组件
 * 用于数值调整，如字体大小、透明度等
 */
export default function Slider({
  label,
  min = 0,
  max = 100,
  step = 1,
  value = 50,
  onChange,
  showValue = true,
  unit = '',
  disabled = false,
  className = '',
}: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(Number(e.target.value))
  }

  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={`${styles.container} ${className}`}>
      {label && (
        <div className={styles.header}>
          <label className={styles.label}>{label}</label>
          {showValue && (
            <span className={styles.value}>
              {value}
              {unit}
            </span>
          )}
        </div>
      )}
      <div className={styles.sliderWrapper}>
        <input
          type="range"
          className={styles.slider}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          style={{
            background: `linear-gradient(to right, rgb(var(--color-primary)) 0%, rgb(var(--color-primary)) ${percentage}%, rgba(var(--border-primary), 0.4) ${percentage}%, rgba(var(--border-primary), 0.4) 100%)`,
          }}
        />
      </div>
    </div>
  )
}
