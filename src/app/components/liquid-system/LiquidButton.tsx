/**
 * LIQUID BUTTON
 * variant glass (Section 11) — pill/regular
 * variant accent + glow (Section 12) — solid com glow
 */

import { ReactNode, useState } from 'react';
import { motion } from 'motion/react';
import {
  glassButton, glassButtonAccent, ACCENT_COLORS, hexToRgb,
  type GlassVariant,
} from '../../utils/liquidGlassStyles';

export interface LiquidButtonProps {
  children:  ReactNode;
  onClick?:  () => void;
  variant?:  GlassVariant;
  /** Usar border-radius full (9999px) */
  pill?:     boolean;
  /** Mostrar anel de glow em volta */
  glow?:     boolean;
  /** Ícone à esquerda */
  icon?:     ReactNode;
  disabled?: boolean;
  size?:     'sm' | 'md' | 'lg';
  type?:     'button' | 'submit' | 'reset';
  className?: string;
}

export function LiquidButton({
  children,
  onClick,
  variant   = 'default',
  pill      = false,
  glow      = false,
  icon,
  disabled  = false,
  size      = 'md',
  type      = 'button',
  className = '',
}: LiquidButtonProps) {
  const [pressed, setPressed] = useState(false);

  const color    = variant === 'default' ? null : ACCENT_COLORS[variant];
  const rgb      = color ? hexToRgb(color) : null;
  const isAccent = !!color;

  const padding =
    size === 'sm' ? '8px 16px' :
    size === 'lg' ? '16px 32px' :
    '12px 24px';

  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;

  const baseStyle = isAccent
    ? {
        ...glassButtonAccent(color!),
        borderRadius: pill ? 9999 : 18,
        padding,
        fontSize,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        border: 'none',
        opacity: disabled ? 0.5 : 1,
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
        transition: 'transform 0.15s',
      }
    : {
        ...glassButton(),
        borderRadius: pill ? 9999 : 20,
        padding,
        fontSize,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        opacity: disabled ? 0.5 : 1,
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
        transition: 'transform 0.15s',
      };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }} className={className}>
      {/* Glow ring */}
      {glow && color && (
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: -4,
            borderRadius: pill ? 9999 : 22,
            background: `rgba(${rgb}, 0.3)`,
            filter: 'blur(8px)',
            pointerEvents: 'none',
          }}
        />
      )}

      <button
        type={type}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        style={baseStyle}
      >
        {/* Inner glow overlay for accent buttons */}
        {isAccent && (
          <span
            style={{
              position: 'absolute', inset: 0,
              borderRadius: 'inherit',
              background: 'radial-gradient(ellipse 100% 80% at 50% 20%, rgba(255,255,255,0.5) 0%, transparent 60%)',
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
            }}
          />
        )}
        {icon && <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>}
        <span style={{ position: 'relative' }}>{children}</span>
      </button>
    </div>
  );
}

LiquidButton.displayName = 'LiquidButton';
