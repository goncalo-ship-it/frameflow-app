import { motion } from 'framer-motion'

const orbs = [
  { color: 'rgba(16, 185, 129, 0.25)', size: 600, x: '10%', y: '15%', duration: 22 },
  { color: 'rgba(245, 158, 11, 0.18)', size: 700, x: '70%', y: '20%', duration: 28 },
  { color: 'rgba(59, 130, 246, 0.15)', size: 550, x: '80%', y: '70%', duration: 32 },
  { color: 'rgba(168, 85, 247, 0.12)', size: 500, x: '30%', y: '75%', duration: 26 },
  { color: 'rgba(239, 68, 68, 0.10)', size: 450, x: '55%', y: '40%', duration: 35 },
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
            filter: 'blur(80px)',
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
