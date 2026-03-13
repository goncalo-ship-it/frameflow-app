/**
 * LIQUID SECTION — Wrapper de secção com título e glow dot
 * Secção 14: glow dots em títulos de secção dentro de widgets
 */

import { ReactNode } from 'react';
import { motion } from 'motion/react';

export interface LiquidSectionProps {
  title?:        string;
  /** Cor do glow dot (hex) */
  accentColor?:  string;
  action?:       ReactNode;
  children:      ReactNode;
  className?:    string;
  animated?:     boolean;
  animationDelay?: number;
}

export function LiquidSection({
  title,
  accentColor,
  action,
  children,
  className    = '',
  animated     = false,
  animationDelay = 0,
}: LiquidSectionProps) {
  const content = (
    <div className={`flex flex-col gap-4 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && (
            <div className="flex items-center gap-2">
              {accentColor && (
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: accentColor,
                    boxShadow:  `0 0 8px ${accentColor}`,
                  }}
                />
              )}
              <span
                style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}
              >
                {title}
              </span>
            </div>
          )}
          {action && (
            <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {action}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: animationDelay / 1000 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

LiquidSection.displayName = 'LiquidSection';
