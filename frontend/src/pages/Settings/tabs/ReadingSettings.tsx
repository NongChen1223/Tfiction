import { useSettingsStore } from '@/stores/settingsStore'
import ColorField from '@/components/common/ColorField'
import Select from '@/components/common/Select'
import Slider from '@/components/common/Slider'
import Toggle from '@/components/common/Toggle'
import styles from './ReadingSettings.module.scss'

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
    bossModeType,
    bossRevealDelay,
    bossHideDelay,
    bossMode,
    bossOpacity,
    setFontSize,
    setFontFamily,
    setLineHeight,
    setPageWidth,
    setBackgroundColor,
    setTextColor,
    setBossModeType,
    setBossRevealDelay,
    setBossHideDelay,
    setBossMode,
    setBossOpacity,
  } = useSettingsStore()

  const fontOptions = [
    { value: 'system', label: '系统默认' },
    { value: 'serif', label: '衬线字体（宋体）' },
    { value: 'sans', label: '无衬线字体（黑体）' },
    { value: 'mono', label: '等宽字体' },
  ]
  const bossModeOptions = [
    { value: 'basic', label: '基础隐身：保留内容，隐藏控件' },
    { value: 'full', label: '完全隐身：移出后内容也淡出' },
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
            label={`字体大小：${fontSize}px`}
            min={12}
            max={32}
            step={1}
            value={fontSize}
            onChange={setFontSize}
            showValue={false}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>排版设置</h2>

        <div className={styles.settingItem}>
          <Slider
            label={`行高：${lineHeight.toFixed(1)} 倍`}
            min={1.0}
            max={3.0}
            step={0.1}
            value={lineHeight}
            onChange={setLineHeight}
            showValue={false}
          />
        </div>

        <div className={styles.settingItem}>
          <Slider
            label={`页面宽度：${pageWidth}px`}
            min={400}
            max={1200}
            step={50}
            value={pageWidth}
            onChange={setPageWidth}
            showValue={false}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>颜色设置</h2>

        <div className={styles.colorRow}>
          <ColorField
            id="reader-background-color"
            className={styles.colorItem}
            label="背景颜色"
            value={backgroundColor}
            onChange={setBackgroundColor}
            helperText="会直接影响阅读页正文底色。"
          />

          <ColorField
            id="reader-text-color"
            className={styles.colorItem}
            label="文字颜色"
            value={textColor}
            onChange={setTextColor}
            helperText="建议和背景保持足够对比度。"
          />
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
          <div className={styles.switchLabel}>
            <div className={styles.switchCopy}>
              <span>启用老板模式</span>
              <p className={styles.switchDescription}>阅读页会即时读取这个开关状态。</p>
            </div>
            <Toggle checked={bossMode} onChange={setBossMode} />
          </div>
        </div>

        <div className={styles.settingItem}>
          <Slider
            label={`透明度：${bossOpacity.toFixed(2)}`}
            min={0.05}
            max={1}
            step={0.05}
            value={bossOpacity}
            onChange={setBossOpacity}
            showValue={false}
          />
        </div>

        <div className={styles.settingItem}>
          <Select
            label="隐身级别"
            options={bossModeOptions}
            value={bossModeType}
            onChange={setBossModeType}
          />
        </div>

        <div className={styles.settingItem}>
          <Slider
            label={`唤出延迟：${bossRevealDelay}ms`}
            min={0}
            max={400}
            step={20}
            value={bossRevealDelay}
            onChange={setBossRevealDelay}
            showValue={false}
          />
        </div>

        <div className={styles.settingItem}>
          <Slider
            label={`隐藏延迟：${bossHideDelay}ms`}
            min={80}
            max={1200}
            step={40}
            value={bossHideDelay}
            onChange={setBossHideDelay}
            showValue={false}
          />
        </div>

        <div className={styles.bossModePreview}>
          <p className={styles.previewLabel}>老板模式预览效果：</p>
          <div className={styles.bossPreviewBox}>
            <div className={styles.bossPreviewContent}>正常内容显示</div>
            <div
              className={`${styles.bossPreviewOverlay} ${
                bossModeType === 'full' ? styles.fullMode : ''
              }`}
              style={{ opacity: bossMode ? bossOpacity : 0 }}
            >
              {bossModeType === 'full' ? '移出后几乎完全隐藏' : '保持可见，但更隐蔽'}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
