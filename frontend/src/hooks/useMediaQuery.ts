import { useEffect, useState } from 'react'

/**
 * useMediaQuery Hook
 * 监听媒体查询变化
 * @param query - 媒体查询字符串，例如 '(max-width: 1000px)'
 * @returns 是否匹配媒体查询
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)

    // 初始化状态
    setMatches(mediaQuery.matches)

    // 监听变化
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // 添加监听器
    mediaQuery.addEventListener('change', handler)

    // 清理函数
    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [query])

  return matches
}
