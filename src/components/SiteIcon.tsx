import { useState } from 'react'

interface SiteIconProps {
  url: string
  title: string
  size?: number
}

export function SiteIcon({ url, title, size = 16 }: SiteIconProps) {
  const [failed, setFailed] = useState(false)

  let faviconUrl: string | null = null
  try {
    const target = new URL(url)
    if (target.protocol === 'http:' || target.protocol === 'https:') {
      faviconUrl = `${chrome.runtime.getURL('_favicon/')}?pageUrl=${encodeURIComponent(target.origin)}&size=32`
    }
  } catch {
    faviconUrl = null
  }

  if (!faviconUrl || failed) {
    const letter = (title.trim()[0] || '?').toUpperCase()
    return (
      <span
        className="site-icon-letter"
        style={{ width: size, height: size, fontSize: size * 0.6 }}
        aria-hidden="true"
      >
        {letter}
      </span>
    )
  }

  return (
    <img
      className="site-icon-img"
      src={faviconUrl}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
