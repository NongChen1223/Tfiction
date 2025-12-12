import { useSettingsStore } from '@/stores/settingsStore'
import Select from '@/components/common/Select'
import Slider from '@/components/common/Slider'
import { HexColorPicker } from 'react-colorful'
import styles from './ReadingSettings.module.css'

/**
 * 阅读设置选项卡
 * 字体、行高、页宽等阅读相关设置
 */
export default function ReadingSettings() {
  const {
    fontSize,
    fontFamily,
    lineHeight,
    pageWidth,
    backgroundColor,
    textColor,
    bossMode,
    bossOpacity,
    setFontSize,
    setFontFamily,
    setLineHeight,
    setPageWidth,
    setBackgroundColor,
    setTextColor,
    setBossMode,
    setBossOpacity,
  } = useSettingsStore()

  const fontOptions = [
    { value: 'system', label: '系统默认' },
    { value: 'serif', label: '衬线字体（宋体）' },
    { value: 'sans', label: '无衬线字体（黑体）' },
    { value: 'mono', label: '等宽字体' },
  ]

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>字体设置</h2>

        <div className={styles.settingItem}>
          <Select
            label="字体系列"
            options={fontOptions}
            value={fontFamily}
            onChange={setFontFamily}
          />
        </div>

        <div className={styles.settingItem}>
          <Slider
            label="字体大小"
            min={12}
            max={32}
            step={1}
            value={fontSize}
            onChange={setFontSize}
            showValue
            unit="px"
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>排版设置</h2>

        <div className={styles.settingItem}>
          <Slider
            label="行高"
            min={1.0}
            max={3.0}
            step={0.1}
            value={lineHeight}
            onChange={setLineHeight}
            showValue
            unit="倍"
          />
        </div>

        <div className={styles.settingItem}>
          <Slider
            label="页面宽度"
            min={400}
            max={1200}
            step={50}
            value={pageWidth}
            onChange={setPageWidth}
            showValue
            unit="px"
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>颜色设置</h2>

        <div className={styles.colorPickerRow}>
          <div className={styles.colorPickerWrapper}>
            <label className={styles.colorLabel}>背景颜色</label>
            <HexColorPicker color={backgroundColor} onChange={setBackgroundColor} />
            <div className={styles.colorInfo}>
              <div className={styles.colorPreview} style={{ backgroundColor }} />
              <span className={styles.colorValue}>{backgroundColor}</span>
            </div>
          </div>

          <div className={styles.colorPickerWrapper}>
            <label className={styles.colorLabel}>文字颜色</label>
            <HexColorPicker color={textColor} onChange={setTextColor} />
            <div className={styles.colorInfo}>
              <div className={styles.colorPreview} style={{ backgroundColor: textColor }} />
              <span className={styles.colorValue}>{textColor}</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>预览</h2>
        <div
          className={styles.previewBox}
          style={{
            fontSize: `${fontSize}px`,
            fontFamily:
              fontFamily === 'system'
                ? 'var(--font-sans)'
                : fontFamily === 'serif'
                ? 'var(--font-serif)'
                : fontFamily === 'mono'
                ? 'var(--font-mono)'
                : 'var(--font-sans)',
            lineHeight: lineHeight,
            maxWidth: `${pageWidth}px`,
            backgroundColor: backgroundColor,
            color: textColor,
          }}
        >
          <p>这是一段示例文本，用于预览当前的阅读设置效果。</p>
          <p>字体大小、字体系列、行高和页面宽度都会影响阅读体验。</p>
          <p>请根据您的喜好调整这些参数，找到最舒适的阅读设置。</p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>老板模式</h2>

        <div className={styles.settingItem}>
          <label className={styles.switchLabel}>
            <input
              type="checkbox"
              checked={bossMode}
              onChange={(e) => setBossMode(e.target.checked)}
              className={styles.switch}
            />
            <span>启用老板模式</span>
          </label>
        </div>

        <div className={styles.settingItem}>
          <Slider
            label="透明度"
            min={0}
            max={1}
            step={0.05}
            value={bossOpacity}
            onChange={setBossOpacity}
            showValue
          />
        </div>

        <div className={styles.bossModePreview}>
          <p className={styles.previewLabel}>老板模式预览效果：</p>
          <div className={styles.bossPreviewBox}>
            <div className={styles.bossPreviewContent}>正常内容显示</div>
            <div
              className={styles.bossPreviewOverlay}
              style={{ opacity: bossMode ? bossOpacity : 0 }}
            >
              看起来像是在工作...
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
