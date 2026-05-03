'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number
  ox: number; oy: number
  vx: number; vy: number
  phase: number; size: number
  opacity: number; color: string
}

export default function ParticleCrowd() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    let W = window.innerWidth
    let H = window.innerHeight

    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    ctx.scale(dpr, dpr)

    const COLORS = ['#E83D8A', '#FF3366', '#c4246a', '#FBBF24', '#FF6B9D']
    const COUNT = 600
    const particles: Particle[] = []

    for (let i = 0; i < COUNT; i++) {
      const x = Math.random() * W
      const y = Math.random() * H
      particles.push({
        x, y, ox: x, oy: y,
        vx: 0, vy: 0,
        phase: Math.random() * Math.PI * 2,
        size: Math.random() * 1.5 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
    }

    const mouse = { x: -1000, y: -1000 }
    const onMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }
    window.addEventListener('pointermove', onMove)

    let animId: number
    const REPEL_RADIUS = 100
    const REPEL_FORCE = 8
    const RETURN_FORCE = 0.025
    const FRICTION = 0.9
    const FLOAT_AMP = 14

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      const time = Date.now() * 0.001

      for (const p of particles) {
        const tx = p.ox + Math.sin(time * 0.5 + p.phase) * FLOAT_AMP
        const ty = p.oy + Math.cos(time * 0.4 + p.phase * 1.3) * FLOAT_AMP

        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < REPEL_RADIUS && dist > 0.1) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_FORCE
          p.vx += (dx / dist) * force
          p.vy += (dy / dist) * force
        }

        // Center Area Atmospheric Fade (Gentle avoid)
        const dcx = (p.x / W) - 0.5
        const dcy = (p.y / H) - 0.5
        const ellipseDist = (dcx * dcx * 10) + (dcy * dcy * 7) 
        
        let centerFade = 1
        if (ellipseDist < 1.4) {
          // Subtle push away (much weaker than before)
          const pushForce = (1.4 - ellipseDist) * 0.4
          p.vx += (dcx > 0 ? 1 : -1) * pushForce * 3.5
          p.vy += (dcy > 0 ? 1 : -1) * pushForce * 3.5
          
          // Smoothly dim the particle as it gets closer
          centerFade = Math.max(0.05, (ellipseDist - 0.1) * 0.9)
        }

        p.vx += (tx - p.x) * RETURN_FORCE
        p.vy += (ty - p.y) * RETURN_FORCE
        p.vx *= FRICTION; p.vy *= FRICTION
        p.x += p.vx; p.y += p.vy

        const currentOpacity = p.opacity * centerFade

        // Subtle soft glow
        const haloR = p.size * 4
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR)
        const alphaHex = Math.round(currentOpacity * 255).toString(16).padStart(2, '0')
        grd.addColorStop(0, p.color + alphaHex)
        grd.addColorStop(0.5, p.color + '11')
        grd.addColorStop(1, p.color + '00')
        ctx.beginPath()
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Tiny crisp center
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${currentOpacity * 0.8})`
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }
    draw()

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight
      canvas.width = W * dpr; canvas.height = H * dpr
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`
      ctx.scale(dpr, dpr)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 2 }} />
}
