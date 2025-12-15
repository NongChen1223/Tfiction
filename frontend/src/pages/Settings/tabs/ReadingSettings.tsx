import { useSettingsStore } from '@/stores/settingsStore'
import { Select, Slider, ColorPicker, Switch } from 'antd'
import type { Color } from 'antd/es/color-picker'
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
          <label className={styles.label}>字体系列</label>
          <Select
            style={{ width: '100%' }}
            options={fontOptions}
            value={fontFamily}
            onChange={setFontFamily}
          />
        </div>

        <div className={styles.settingItem}>
          <label className={styles.label}>字体大小：{fontSize}px</label>
          <Slider
            min={12}
            max={32}
            step={1}
            value={fontSize}
            onChange={setFontSize}
            tooltip={{ formatter: (value) => `${value}px` }}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>排版设置</h2>

        <div className={styles.settingItem}>
          <label className={styles.label}>行高：{lineHeight.toFixed(1)}倍</label>
          <Slider
            min={1.0}
            max={3.0}
            step={0.1}
            value={lineHeight}
            onChange={setLineHeight}
            tooltip={{ formatter: (value) => `${value?.toFixed(1)}倍` }}
          />
        </div>

        <div className={styles.settingItem}>
          <label className={styles.label}>页面宽度：{pageWidth}px</label>
          <Slider
            min={400}
            max={1200}
            step={50}
            value={pageWidth}
            onChange={setPageWidth}
            tooltip={{ formatter: (value) => `${value}px` }}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>颜色设置</h2>

        <div className={styles.colorRow}>
          <div className={styles.colorItem}>
            <label className={styles.label}>背景颜色</label>
            <ColorPicker
              value={backgroundColor}
              onChange={(color: Color) => setBackgroundColor(color.toHexString())}
              showText
              size="large"
            />
          </div>

          <div className={styles.colorItem}>
            <label className={styles.label}>文字颜色</label>
            <ColorPicker
              value={textColor}
              onChange={(color: Color) => setTextColor(color.toHexString())}
              showText
              size="large"
            />
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
            <span>启用老板模式</span>
            <Switch checked={bossMode} onChange={setBossMode} />
          </label>
        </div>

        <div className={styles.settingItem}>
          <label className={styles.label}>透明度：{bossOpacity.toFixed(2)}</label>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={bossOpacity}
            onChange={setBossOpacity}
            tooltip={{ formatter: (value) => value?.toFixed(2) }}
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
