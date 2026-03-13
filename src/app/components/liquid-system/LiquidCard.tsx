/**
 * LIQUID CARD — Widget container principal (4 layers)
 * CLAUDE.md Secção 1: glass base + lensing + inner highlight + ultra-thin border
 */

import { ReactNode, CSSProperties } from 'react';
import { motion } from 'motion/react';
import {
  glassCard, lensingOverlay, springConfigs,
  type GlassIntensity, type CornerRadius,
} from '../../utils/liquidGlassStyles';

export interface LiquidCardProps {
  children: ReactNode;
  intensity?:      GlassIntensity;
  radius?:         CornerRadius;
  animated?:       boolean;
  animationDelay?: number;
  /** Incluir lensing layer (default true) */
  lensing?:        boolean;
  padding?:        string;
  onClick?:        () => void;
  className?:      string;
  style?:          CSSProperties;
}

export function LiquidCard({
  children,
  intensity      = 'medium',
  radius         = 'xl',
  animated       = false,
  animationDelay = 0,
  lensing        = true,
  padding        = '24px',
  onClick,
  className      = '',
  style,
}: LiquidCardProps) {
  const baseStyle: CSSProperties = {
    ...glassCard({ intensity, radius, interactive: !!onClick }),
    padding,
    cursor: onClick ? 'pointer' : undefined,
    ...style,
  };

  const content = (
    <>
      {lensing && <div style={lensingOverlay({ radius })} />}
      <div className="relative z-10">{children}</div>
    </>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfigs.gentle, delay: animationDelay / 1000 }}
        whileHover={onClick ? { scale: 1.01 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
        onClick={onClick}
        className={className}
        style={baseStyle}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div onClick={onClick} className={className} style={baseStyle}>
      {content}
    </div>
  );
}

LiquidCard.displayName = 'LiquidCard';
