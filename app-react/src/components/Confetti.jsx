import { useEffect, useRef } from 'react'

const COLORS = ['#14FF46', '#FFB300', '#FFFFFF', '#FF3B3B', '#00C853']

export default function Confetti() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const W = 1080, H = 1920
    canvas.width = W
    canvas.height = H

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * W,
      y: Math.random() * -300 - 50,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 4 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: Math.random() * 12 + 6,
      h: Math.random() * 8 + 4,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.15,
    }))

    const end = performance.now() + 2200
    let raf

    const draw = (now) => {
      if (now > end) {
        ctx.clearRect(0, 0, W, H)
        return
      }
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15
        p.angle += p.spin
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1080,
        height: 1920,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    />
  )
}
