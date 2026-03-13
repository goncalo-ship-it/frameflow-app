import { motion } from 'framer-motion'

// Orbs calibrados para fundo escuro (#1c1d24 → #4e4c57)
// Mais luminosos que no fundo claro — o negro absorve mais luz
const orbs = [
  { color: 'rgba(16, 185, 129, 0.14)', blur: 90,  size: 650, x: '5%',  y: '10%', duration: 22 },
  { color: 'rgba(168, 85, 247, 0.09)', blur: 110, size: 720, x: '65%', y: '15%', duration: 28 },
  { color: 'rgba(59, 130, 246, 0.08)', blur: 95,  size: 580, x: '75%', y: '60%', duration: 32 },
]

export function BackgroundOrbs() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -1,
      }}
      aria-hidden="true"
    >
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: `blur(${orb.blur}px)`,
            willChange: 'transform',
          }}
          animate={{
            x: [0, 60, -40, 20, 0],
            y: [0, -50, 30, -20, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
