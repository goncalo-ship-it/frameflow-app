/**
 * LIQUID ALERT
 * borderRadius 20px, accent left edge 2.5px (glow line)
 * Lensing colorido (accent em vez de branco)
 * critical: border pulse animation 2s
 */

import { ReactNode } from 'react';
import { ACCENT_COLORS, hexToRgb, type GlassVariant } from '../../utils/liquidGlassStyles';

export interface LiquidAlertProps {
  children:  ReactNode;
  variant?:  GlassVariant;
  title?:    string;
  icon?:     ReactNode;
  critical?: boolean;
}

export function LiquidAlert({
  children,
  variant  = 'amber',
  title,
  icon,
  critical = false,
}: LiquidAlertProps) {
  const color = ACCENT_COLORS[variant] || '#f59e0b';
  const rgb   = hexToRgb(color);

  return (
    <div
      style={{
        position:     'relative',
        overflow:     'hidden',
        borderRadius: 20,
        background:   `rgba(${rgb}, 0.08)`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border:       `0.5px solid rgba(${rgb}, 0.25)`,
        boxShadow:    `0 4px 16px rgba(0,0,0,0.10), inset 0 0.5px 0.5px rgba(255,255,255,0.15)`,
        padding:      '14px 16px 14px 20px',
        animation:    critical ? 'liquid-alert-pulse 2s infinite' : undefined,
      }}
    >
      {/* Accent left edge glow line */}
      <div
        style={{
          position:     'absolute',
          left:         0, top: 0, bottom: 0,
          width:        2.5,
          background:   color,
          boxShadow:    `0 0 8px rgba(${rgb}, 0.60)`,
          borderRadius: '20px 0 0 20px',
        }}
      />

      {/* Colored lensing */}
      <div
        style={{
          position:     'absolute',
          inset:        0,
          pointerEvents:'none',
          background:   `radial-gradient(ellipse 120% 60% at 50% -10%, rgba(${rgb}, 0.20) 0%, transparent 50%)`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {icon && (
          <span style={{ color, flexShrink: 0, marginTop: 1, display: 'flex' }}>
            {icon}
          </span>
        )}
        <div>
          {title && (
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.95)', marginBottom: 4 }}>
              {title}
            </div>
          )}
          <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.70)', lineHeight: 1.5 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

LiquidAlert.displayName = 'LiquidAlert';
