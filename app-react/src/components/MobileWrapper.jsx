import { useState, useEffect } from 'react'

const KIOSK_W = 1080
const KIOSK_H = 1920

export default function MobileWrapper({ children }) {
  const [scale, setScale] = useState(0.3)

  useEffect(() => {
    const resize = () => {
      const vw = document.documentElement.clientWidth
      const vh = window.visualViewport?.height || window.innerHeight
      const sw = vw / KIOSK_W
      const sh = vh / KIOSK_H
      setScale(Math.min(sw, sh))
    }
    resize()
    window.addEventListener('resize', resize)
    window.visualViewport?.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      window.visualViewport?.removeEventListener('resize', resize)
    }
  }, [])

  const scaledW = KIOSK_W * scale
  const scaledH = KIOSK_H * scale

  return (
    <div style={{
      width: '100dvw',
      height: '100dvh',
      overflow: 'hidden',
      background: '#0032A0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: scaledW,
        height: scaledH,
        overflow: 'hidden',
      }}>
        <div style={{
          width: KIOSK_W,
          height: KIOSK_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'relative',
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}
