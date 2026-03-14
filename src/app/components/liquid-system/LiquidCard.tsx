/**
 * LIQUID CARD — Widget container principal (4 layers)
 * Glass base + lensing + inner highlight + ultra-thin border
 */

import { ReactNode, CSSProperties } from 'react';
import { motion } from 'motion/react';
import {
  glassCard, lensingOverlay, ACCENT_COLORS, hexToRgb,
  type GlassIntensity, type CornerRadius, type GlassVariant,
} from '../../utils/liquidGlassStyles';

export interface LiquidCardProps {
  children: ReactNode;
  intensity?:      GlassIntensity;
  variant?:        GlassVariant;
  radius?:         CornerRadius;
  animated?:       boolean;
  animationDelay?: number;
  lensing?:        boolean;
  glow?:           boolean;
  padding?:        string;
  onClick?:        () => void;
  className?:      string;
  style?:          CSSProperties;
}

export function LiquidCard({
  children,
  intensity      = 'medium',
  variant        = 'default',
  radius         = 'xl',
  animated       = false,
  animationDelay = 0,
  lensing        = true,
  glow           = false,
  padding        = '24px',
  onClick,
  className      = '',
  style,
}: LiquidCardProps) {
  const accentColor = variant !== 'default' ? ACCENT_COLORS[variant] : null;
  const rgb         = accentColor ? hexToRgb(accentColor) : null;

  const baseStyle: CSSProperties = {
    ...glassCard({ intensity, radius, interactive: !!onClick }),
    ...(accentColor && rgb ? {
      background: `rgba(${rgb}, 0.12)`,
      border:     `0.5px solid rgba(${rgb}, 0.30)`,
    } : {}),
    ...(glow && accentColor ? {
      boxShadow: `0 0 24px rgba(${rgb}, 0.40), 0 4px 24px rgba(0,0,0,0.08), inset 0 0.5px 0 rgba(255,255,255,0.10)`,
    } : {}),
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
        transition={{ duration: 0.6, delay: animationDelay / 1000, ease: [0.25, 0.1, 0.25, 1] }}
        whileTap={onClick ? { scale: 0.97 } : undefined}
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
