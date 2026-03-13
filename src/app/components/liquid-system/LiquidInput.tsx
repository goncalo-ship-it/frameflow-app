/**
 * LIQUID INPUT
 * bg: rgba(0,0,0,0.20) — escuro, precisa contraste
 * blur(12px), borderRadius 16px (md default)
 * Focus: border 0.5px solid #10b981, box-shadow 0 0 0 3px rgba(16,185,129,0.15)
 * Error: border 0.5px solid #ef4444, focus ring vermelho
 */

import { InputHTMLAttributes, ReactNode, useState } from 'react';
import { glassInput, CORNER_VALUES, type CornerRadius } from '../../utils/liquidGlassStyles';

export interface LiquidInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Ícone à esquerda */
  icon?:   ReactNode;
  radius?: CornerRadius;
  error?:  boolean;
}

export function LiquidInput({
  icon,
  radius = 'md',
  error  = false,
  style,
  onFocus,
  onBlur,
  ...props
}: LiquidInputProps) {
  const [focused, setFocused] = useState(false);
  const r = CORNER_VALUES[radius];

  const focusAccent = error ? '#ef4444' : '#10b981';
  const focusAlpha  = error ? '0.15'    : '0.15';

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        ...glassInput(radius),
        padding: icon ? '10px 14px 10px 42px' : '10px 14px',
        border: focused
          ? `0.5px solid ${focusAccent}`
          : error
          ? '0.5px solid #ef4444'
          : '0.5px solid rgba(255, 255, 255, 0.12)',
        boxShadow: focused
          ? `0 0 0 3px rgba(${error ? '239,68,68' : '16,185,129'}, ${focusAlpha}), inset 0 0.5px 0.5px rgba(255,255,255,0.10)`
          : 'inset 0 0.5px 0.5px rgba(255,255,255,0.10)',
        transition: '0.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
      }}
    >
      {icon && (
        <span
          style={{
            position: 'absolute',
            left: 14,
            display: 'flex',
            color: focused ? focusAccent : 'rgba(255, 255, 255, 0.4)',
            pointerEvents: 'none',
            transition: '0.2s',
          }}
        >
          {icon}
        </span>
      )}
      <input
        {...props}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e)  => { setFocused(false); onBlur?.(e); }}
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          outline: 'none',
          color: '#ffffff',
          fontSize: 14,
          fontFamily: 'inherit',
          width: '100%',
          ...style,
        }}
      />
    </div>
  );
}

LiquidInput.displayName = 'LiquidInput';
