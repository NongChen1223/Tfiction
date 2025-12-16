import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import styles from './Select.module.scss'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  label?: string
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Select 选择器组件
 * 用于下拉选择，如字体选择、主题选择等
 */
export default function Select({
  label,
  options,
  value,
  onChange,
  placeholder = '请选择',
  disabled = false,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={`${styles.container} ${className}`} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.selectWrapper}>
        <button
          type="button"
          className={`${styles.select} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className={styles.selectedText}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}
            size={20}
          />
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.option} ${value === option.value ? styles.selected : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                {value === option.value && <Check className={styles.checkIcon} size={16} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
