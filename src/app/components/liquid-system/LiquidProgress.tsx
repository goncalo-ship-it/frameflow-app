/**
 * LIQUID PROGRESS
 * Track: pill, bg rgba(255,255,255,0.08), heights: sm=4 md=8 lg=12px
 * Fill: linear-gradient(90deg, accentColor_cc, accentColor) + spring gentle
 */

import { motion } from 'motion/react';
import { ACCENT_COLORS, hexToRgb, springConfigs, type GlassVariant } from '../../utils/liquidGlassStyles';

export interface LiquidProgressProps {
  value:    number;   // 0–100
  variant?: GlassVariant;
  size?:    'sm' | 'md' | 'lg';
  label?:   string;
  showValue?: boolean;
}

const HEIGHT_MAP = { sm: 4, md: 8, lg: 12 };

export function LiquidProgress({
  value,
  variant   = 'emerald',
  size      = 'md',
  label,
  showValue = false,
}: LiquidProgressProps) {
  const color  = ACCENT_COLORS[variant] || '#10b981';
  const rgb    = hexToRgb(color);
  const h      = HEIGHT_MAP[size];
  const pct    = Math.min(100, Math.max(0, value));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {label && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {label}
            </span>
          )}
          {showValue && (
            <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.8)', tabularNums: true } as any}>
              {pct}%
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        style={{
          height:       h,
          borderRadius: 9999,
          background:   'rgba(255, 255, 255, 0.08)',
          overflow:     'hidden',
          position:     'relative',
        }}
      >
        {/* Fill */}
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={springConfigs.gentle}
          style={{
            position:     'absolute',
            top: 0, bottom: 0, left: 0,
            borderRadius: 9999,
            background:   `linear-gradient(90deg, rgba(${rgb}, 0.8), ${color})`,
            boxShadow:    `0 0 8px rgba(${rgb}, 0.40)`,
          }}
        />
      </div>
    </div>
  );
}

LiquidProgress.displayName = 'LiquidProgress';
