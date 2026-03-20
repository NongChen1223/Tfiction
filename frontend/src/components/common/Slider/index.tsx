import { useEffect, useRef, useState } from 'react'
import styles from './Slider.module.scss'

export interface SliderProps {
  label?: string
  min?: number
  max?: number
  step?: number
  value?: number
  onChange?: (value: number) => void
  commitOnRelease?: boolean
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
  commitOnRelease = false,
  showValue = true,
  unit = '',
  disabled = false,
  className = '',
}: SliderProps) {
  const [draftValue, setDraftValue] = useState(value)
  const [isInteracting, setIsInteracting] = useState(false)
  const latestValueRef = useRef(value)

  useEffect(() => {
    latestValueRef.current = value

    if (!commitOnRelease || !isInteracting) {
      setDraftValue(value)
    }
  }, [commitOnRelease, isInteracting, value])

  useEffect(() => {
    if (!commitOnRelease || !isInteracting) {
      return
    }

    const finishInteraction = () => {
      setIsInteracting(false)
      onChange?.(latestValueRef.current)
    }

    window.addEventListener('pointerup', finishInteraction)
    window.addEventListener('pointercancel', finishInteraction)

    return () => {
      window.removeEventListener('pointerup', finishInteraction)
      window.removeEventListener('pointercancel', finishInteraction)
    }
  }, [commitOnRelease, isInteracting, onChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(e.target.value)
    latestValueRef.current = nextValue

    if (commitOnRelease) {
      setDraftValue(nextValue)
      return
    }

    onChange?.(nextValue)
  }

  const displayValue = commitOnRelease ? draftValue : value
  const percentage = ((displayValue - min) / (max - min)) * 100

  return (
    <div className={`${styles.container} ${className}`}>
      {label && (
        <div className={styles.header}>
          <label className={styles.label}>{label}</label>
          {showValue && (
            <span className={styles.value}>
              {displayValue}
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
          value={displayValue}
          onChange={handleChange}
          onPointerDown={() => {
            if (!commitOnRelease) {
              return
            }

            setIsInteracting(true)
          }}
          onKeyUp={() => {
            if (!commitOnRelease) {
              return
            }

            setIsInteracting(false)
            onChange?.(latestValueRef.current)
          }}
          onBlur={() => {
            if (!commitOnRelease) {
              return
            }

            setIsInteracting(false)
            onChange?.(latestValueRef.current)
          }}
          disabled={disabled}
          style={{
            background: `linear-gradient(to right, rgb(var(--color-primary)) 0%, rgb(var(--color-primary)) ${percentage}%, rgb(var(--neo-panel-muted)) ${percentage}%, rgb(var(--neo-panel-muted)) 100%)`,
          }}
        />
      </div>
    </div>
  )
}
