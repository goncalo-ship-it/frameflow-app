/**
 * LIQUID TOGGLE
 * Track SEMPRE pill, ON: accentColor sólido + glow 40%
 * Thumb: spring snappy (damping:12, stiffness:200)
 * OFF→ON translate: sm=16px | md=20px | lg=24px
 */

import { motion } from 'motion/react';
import { ACCENT_COLORS, hexToRgb, springConfigs, type GlassVariant } from '../../utils/liquidGlassStyles';

export interface LiquidToggleProps {
  checked:   boolean;
  onChange:  (checked: boolean) => void;
  variant?:  GlassVariant;
  size?:     'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const SIZE_MAP = {
  sm: { trackW: 36, trackH: 20, thumbSize: 14, translateX: 16 },
  md: { trackW: 44, trackH: 24, thumbSize: 18, translateX: 20 },
  lg: { trackW: 52, trackH: 28, thumbSize: 22, translateX: 24 },
};

export function LiquidToggle({
  checked,
  onChange,
  variant  = 'emerald',
  size     = 'md',
  disabled = false,
}: LiquidToggleProps) {
  const color   = ACCENT_COLORS[variant] || '#10b981';
  const rgb     = hexToRgb(color);
  const { trackW, trackH, thumbSize, translateX } = SIZE_MAP[size];
  const thumbOffset = (trackH - thumbSize) / 2;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width:   trackW,
        height:  trackH,
        borderRadius: 9999,
        position: 'relative',
        flexShrink: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        border: 'none',
        padding: 0,
        background: checked
          ? color
          : 'rgba(255, 255, 255, 0.12)',
        boxShadow: checked
          ? `0 0 12px rgba(${rgb}, 0.40), inset 0 0.5px 0.5px rgba(255,255,255,0.25)`
          : 'inset 0 0.5px 0.5px rgba(255,255,255,0.15)',
        transition: 'background 0.2s, box-shadow 0.2s',
      }}
    >
      <motion.span
        animate={{ x: checked ? translateX : 0 }}
        transition={springConfigs.snappy}
        style={{
          position: 'absolute',
          top: thumbOffset,
          left: thumbOffset,
          width: thumbSize,
          height: thumbSize,
          borderRadius: 9999,
          background: '#ffffff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          display: 'block',
        }}
      />
    </button>
  );
}

LiquidToggle.displayName = 'LiquidToggle';
