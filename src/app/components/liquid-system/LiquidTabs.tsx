/**
 * LIQUID TABS
 * Track: borderRadius 14px, bg rgba(255,255,255,0.08), blur(12px), padding 4px
 * Tab inactivo: transparent
 * Tab activo: solid accent (default: var(--fb-emerald)), boxShadow glow 40%
 * Nested corners: track=14px → tab=12px
 */

import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ACCENT_COLORS, hexToRgb, springConfigs, type GlassVariant } from '../../utils/liquidGlassStyles';

export interface LiquidTab {
  id:      string;
  label:   string;
  icon?:   ReactNode;
  count?:  number;
  color?:  string;
  variant?: GlassVariant;
}

export interface LiquidTabsProps {
  tabs:     LiquidTab[];
  active:   string;
  onChange: (id: string) => void;
}

export function LiquidTabs({ tabs, active, onChange }: LiquidTabsProps) {
  return (
    <div
      className="flex items-center gap-1 overflow-x-auto"
      style={{
        background:           'rgba(255, 255, 255, 0.08)',
        backdropFilter:       'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border:               '0.5px solid rgba(255, 255, 255, 0.12)',
        boxShadow:            'inset 0 0.5px 0.5px rgba(255,255,255,0.15)',
        borderRadius:         14,
        padding:              4,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const color    = tab.color || (tab.variant && tab.variant !== 'default' ? ACCENT_COLORS[tab.variant] : '#10b981');
        const rgb      = hexToRgb(color);

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex items-center gap-1.5 flex-shrink-0"
            style={{
              padding:       '7px 14px',
              borderRadius:  12,
              fontSize:      13,
              fontWeight:    isActive ? 700 : 500,
              color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
              background:    isActive ? color : 'transparent',
              border:        'none',
              boxShadow:     isActive ? `0 2px 8px rgba(${rgb}, 0.40)` : undefined,
              cursor:        'pointer',
              transition:    '0.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
          >
            {tab.icon && <span style={{ display: 'flex' }}>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : `rgba(${rgb}, 0.30)`,
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 900,
                  padding: '1px 5px',
                  borderRadius: 9999,
                  minWidth: 16,
                  textAlign: 'center',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

LiquidTabs.displayName = 'LiquidTabs';
