import { useEffect, useState } from 'react'
import CamouflagePendant from '@/components/features/CamouflagePendant'
import styles from './CamouflagePreview.module.scss'

type PreviewStage = 'expanded' | 'collapsing' | 'collapsed' | 'expanding'

const PREVIEW_ANIMATION_MS = 220

/**
 * 设置页里的收纳伪装演示。
 * 用简化版阅读框模拟“移出后收纳、双击挂件恢复”的交互。
 */
export default function CamouflagePreview() {
  const [stage, setStage] = useState<PreviewStage>('expanded')

  useEffect(() => {
    if (stage !== 'collapsing' && stage !== 'expanding') {
      return
    }

    const timer = window.setTimeout(() => {
      setStage(stage === 'collapsing' ? 'collapsed' : 'expanded')
    }, PREVIEW_ANIMATION_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [stage])

  const startCollapse = () => {
    if (stage !== 'expanded') {
      return
    }

    setStage('collapsing')
  }

  const restore = () => {
    if (stage !== 'collapsed') {
      return
    }

    setStage('expanding')
  }

  return (
    <div className={styles.preview}>
      <div className={styles.stage}>
        {stage !== 'collapsed' && (
          <div
            className={`${styles.demoShell} ${
              stage === 'collapsing' ? styles.demoShellCollapsing : ''
            } ${stage === 'expanding' ? styles.demoShellExpanding : ''}`}
            onMouseLeave={startCollapse}
          >
            <div className={styles.demoToolbar}>
              <span>摸鱼模式阅读框</span>
              <span>目录 · 上下章 · 透明度</span>
            </div>
            <div className={styles.demoContent}>
              <p>把鼠标移出演示卡片，阅读框会收纳为一个小挂件。</p>
              <p>再双击挂件，阅读框就会恢复回来。</p>
            </div>
            <div className={styles.demoFooter}>
              <span>总进度 46.5%</span>
              <span>章节 12 / 30</span>
            </div>
          </div>
        )}

        <div
          className={`${styles.pendantDock} ${
            stage === 'collapsed' ? styles.pendantVisible : ''
          } ${stage === 'expanding' ? styles.pendantLeaving : ''}`}
          onDoubleClick={restore}
        >
          <CamouflagePendant
            variant="preview"
            title="伪装中"
            subtitle="双击展开 · 正式模式可拖动"
          />
        </div>
      </div>
      <p className={styles.caption}>移出演示卡片时收纳，双击挂件时恢复。</p>
    </div>
  )
}
