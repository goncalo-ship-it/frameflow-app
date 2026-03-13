/**
 * LIQUID PAGE — Layout de página com header + conteúdo
 * Tipografia: h1 text-3xl font-black + subtitle text-xs (Secção 24)
 */

import { ReactNode } from 'react';
import { motion } from 'motion/react';

export interface LiquidPageProps {
  title?:        string;
  description?:  string;
  headerAction?: ReactNode;
  children:      ReactNode;
  className?:    string;
}

export function LiquidPage({
  title,
  description,
  headerAction,
  children,
  className = '',
}: LiquidPageProps) {
  return (
    <div
      className={`flex flex-col gap-6 p-6 min-h-full ${className}`}
      style={{ maxWidth: 1400, width: '100%', margin: '0 auto' }}
    >
      {(title || headerAction) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex items-start justify-between gap-4"
        >
          {title && (
            <div>
              <h1
                style={{
                  fontSize:      28,
                  fontWeight:    700,
                  letterSpacing: '-0.02em',
                  color:         'rgba(255,255,255,0.95)',
                  textShadow:    '0 2px 8px rgba(0,0,0,0.3)',
                  margin:        0,
                }}
              >
                {title}
              </h1>
              {description && (
                <p
                  className="text-xs font-bold mt-1"
                  style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                >
                  {description}
                </p>
              )}
            </div>
          )}
          {headerAction && (
            <div className="flex-shrink-0">
              {headerAction}
            </div>
          )}
        </motion.div>
      )}

      {children}
    </div>
  );
}

LiquidPage.displayName = 'LiquidPage';
