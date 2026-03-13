import { motion } from 'framer-motion';

/**
 * DASHBOARD LOADING STATE
 * Cards skeleton com animação liquid/staggered
 * Inspirado em iOS loading states com glassmorphism
 */

interface SkeletonCardProps {
  delay?: number;
  variant?: 'hero' | 'kpi' | 'list' | 'section';
  span?: number;
}

function SkeletonCard({ delay = 0, variant = 'kpi', span = 1 }: SkeletonCardProps) {
  const variants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1], // Ease out cubic
      }
    }
  };

  // Hero card (grande)
  if (variant === 'hero') {
    return (
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        className={`rounded-[32px] p-8 relative overflow-hidden ${span > 1 ? `lg:col-span-${span}` : ''}`}
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Liquid blobs animados */}
        <motion.div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, #10b981 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />

        {/* Content skeleton */}
        <div className="relative z-10 space-y-4">
          <motion.div
            className="h-10 w-64 rounded-2xl"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="h-4 w-96 rounded-xl"
            style={{ background: 'rgba(255, 255, 255, 0.08)' }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
        </div>

        {/* Time skeleton (direita) */}
        <div className="absolute top-8 right-8">
          <motion.div
            className="h-16 w-32 rounded-2xl"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
          />
        </div>
      </motion.div>
    );
  }

  // KPI card (médio)
  if (variant === 'kpi') {
    const colors = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return (
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        className="rounded-[28px] p-7 relative overflow-hidden"
        style={{
          background: `${color}12`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${color}25`,
          boxShadow: `0 8px 32px ${color}15`,
        }}
      >
        {/* Liquid blob */}
        <motion.div
          className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: delay,
          }}
        />

        <div className="relative z-10 space-y-4">
          {/* Icon skeleton */}
          <motion.div
            className="w-12 h-12 rounded-[18px]"
            style={{ background: `${color}20` }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Value skeleton */}
          <motion.div
            className="h-10 w-20 rounded-xl"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.1,
            }}
          />
          {/* Label skeleton */}
          <motion.div
            className="h-3 w-16 rounded-lg"
            style={{ background: 'rgba(255, 255, 255, 0.06)' }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
        </div>
      </motion.div>
    );
  }

  // List card
  if (variant === 'list') {
    return (
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        className="rounded-[28px] p-7 backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '0.5px solid rgba(255, 255, 255, 0.18)',
          boxShadow: 'inset 0 0.5px 0.5px rgba(255, 255, 255, 0.25), 0 8px 32px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            className="w-12 h-12 rounded-[20px]"
            style={{ background: 'rgba(16, 185, 129, 0.15)' }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <div className="space-y-2 flex-1">
            <motion.div
              className="h-4 w-32 rounded-lg"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              animate={{
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="h-3 w-24 rounded-lg"
              style={{ background: 'rgba(255, 255, 255, 0.06)' }}
              animate={{
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.1,
              }}
            />
          </div>
        </div>

        {/* List items */}
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="rounded-[18px] p-4 flex items-center gap-3"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: delay + (i * 0.1),
              }}
            >
              <motion.div
                className="h-3 flex-1 rounded-lg"
                style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                animate={{
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Section card (collapsible)
  if (variant === 'section') {
    return (
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        className="rounded-[28px] overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px) saturate(120%)',
          border: '0.5px solid rgba(255, 255, 255, 0.18)',
          boxShadow: 'inset 0 0.5px 0.5px rgba(255, 255, 255, 0.25), 0 8px 32px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Header */}
        <div className="px-7 py-5 flex items-center gap-4">
          <motion.div
            className="w-11 h-11 rounded-[18px]"
            style={{ background: 'rgba(16, 185, 129, 0.15)' }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="h-4 w-48 rounded-lg flex-1"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.1,
            }}
          />
        </div>

        {/* Content */}
        <div className="px-7 pb-7 space-y-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-20 rounded-[22px]"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: delay + (i * 0.15),
              }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  return null;
}

export function DashboardLoadingState() {
  return (
    <div className="min-h-screen p-6 relative overflow-hidden">
      {/* BACKGROUND: handled by Layout.tsx */}

      <div className="max-w-[1600px] mx-auto space-y-6 relative z-10">
        
        {/* HERO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hero card */}
          <div className="lg:col-span-8">
            <SkeletonCard delay={0} variant="hero" />
          </div>
          {/* Weather */}
          <div className="lg:col-span-4">
            <SkeletonCard delay={0.1} variant="hero" />
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard delay={0.2} variant="kpi" />
          <SkeletonCard delay={0.3} variant="kpi" />
          <SkeletonCard delay={0.4} variant="kpi" />
          <SkeletonCard delay={0.5} variant="kpi" />
        </div>

        {/* SECTION */}
        <SkeletonCard delay={0.6} variant="section" />

        {/* GRID 2 COLS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard delay={0.7} variant="list" />
          <SkeletonCard delay={0.8} variant="list" />
        </div>

        {/* SECTIONS */}
        <SkeletonCard delay={0.9} variant="section" />
        <SkeletonCard delay={1.0} variant="section" />

      </div>
    </div>
  );
}