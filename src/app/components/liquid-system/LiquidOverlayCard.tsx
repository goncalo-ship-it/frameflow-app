/**
 * LIQUID OVERLAY CARD — v3
 *
 * Architecture: position:absolute inside position:relative trigger wrapper.
 * No portals. No position:fixed. No anchorRef.
 *
 * Usage:
 *   <div className="relative">          ← trigger wrapper (MUST be relative)
 *     <button>...</button>
 *     <LiquidOverlayCard isVisible={open}>
 *       ...content
 *     </LiquidOverlayCard>
 *   </div>
 *
 * Auto Y: prefers below trigger; flips above if overlay doesn't fit AND more space above.
 * Auto X: center → start → end → nudgeX pixel correction.
 * Arrow: CSS triangle pointing toward trigger, aligned at 50% of overlay.
 * Z:     zIndex 50 — always above siblings, never fights modals (z-100+).
 *
 * Glass: rgba(12,12,16,0.92) + blur(32px) saturate(150%) + border-radius 24px
 * Spring: snappy { type:spring, damping:12, stiffness:200 }
 */

import { ReactNode, useRef, useState, useEffect, useLayoutEffect, CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springConfigs } from '../../utils/liquidGlassStyles';

/* ──────────────────────────────────────────────────────────────────
   TYPES
────────────────────────────────────────────────────────────────── */

export interface LiquidOverlaySection {
  icon?: ReactNode;
  title: string;
  color?: string;
  content: ReactNode;
}

export interface LiquidOverlayCardProps {
  isVisible: boolean;
  accentColor?: string;
  title?: string;
  subtitle?: string;
  sections?: LiquidOverlaySection[];
  children?: ReactNode;
  /** Preferred Y side. 'auto' detects available space. */
  position?: 'top' | 'bottom' | 'auto';
  /** Preferred X alignment. 'auto' tries center → start → end → nudge. */
  alignX?: 'center' | 'start' | 'end' | 'auto';
  maxWidth?: number;
  /** Min width of the overlay (px). Default 200. */
  minWidth?: number;
  /** Gap between trigger edge and overlay (px). Default 8. */
  gap?: number;
  /** Min distance from viewport edges (px). Default 12. */
  viewportPadding?: number;
  /** Show CSS arrow pointing toward trigger. Default false. */
  showArrow?: boolean;
  /** Pass-through pointer events to overlay content. */
  interactive?: boolean;
  className?: string;
}

type Side = 'top' | 'bottom';
type AlignResult = 'center' | 'start' | 'end';

interface Placement {
  side: Side;
  left: number;       // px offset from parent left edge (absolute)
  nudgeX: number;     // px correction applied
  align: AlignResult;
  transformOrigin: string;
}

/* ──────────────────────────────────────────────────────────────────
   CONSTANTS
────────────────────────────────────────────────────────────────── */

const ARROW_SIZE = 6; // px half-width of CSS triangle

/* ──────────────────────────────────────────────────────────────────
   PLACEMENT ENGINE
────────────────────────────────────────────────────────────────── */

function computePlacement(
  triggerRect: DOMRect,
  overlayWidth: number,
  overlayHeight: number,
  gap: number,
  viewportPadding: number,
  preferredSide: 'top' | 'bottom' | 'auto',
  preferredAlignX: 'center' | 'start' | 'end' | 'auto',
): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = viewportPadding;

  /* ── Y axis ─────────────────────────────────────────────────── */
  const spaceBelow = vh - triggerRect.bottom - gap;
  const spaceAbove = triggerRect.top - gap;

  let side: Side;
  if (preferredSide === 'bottom') side = 'bottom';
  else if (preferredSide === 'top') side = 'top';
  else {
    // auto: prefer bottom; flip to top only if overlay doesn't fit below AND more space above
    side = (spaceBelow >= overlayHeight || spaceBelow >= spaceAbove) ? 'bottom' : 'top';
  }

  /* ── X axis ─────────────────────────────────────────────────── */
  // All x values are in VIEWPORT coordinates; we'll convert to parent-relative at the end.
  const triggerCX = triggerRect.left + triggerRect.width / 2;

  // Positions in viewport px
  const centerLeft = triggerCX - overlayWidth / 2;
  const startLeft  = triggerRect.left;
  const endLeft    = triggerRect.right - overlayWidth;

  function fits(left: number) {
    return left >= pad && left + overlayWidth <= vw - pad;
  }

  let alignResult: AlignResult;
  let vpLeft: number; // viewport-relative left of overlay
  let nudgeX = 0;

  if (preferredAlignX === 'center' || preferredAlignX === 'auto') {
    if (fits(centerLeft)) {
      alignResult = 'center'; vpLeft = centerLeft;
    } else if (fits(startLeft)) {
      alignResult = 'start'; vpLeft = startLeft;
    } else if (fits(endLeft)) {
      alignResult = 'end'; vpLeft = endLeft;
    } else {
      // nudge fallback: clamp centerLeft
      alignResult = 'center';
      vpLeft = Math.max(pad, Math.min(vw - pad - overlayWidth, centerLeft));
      nudgeX = vpLeft - centerLeft;
    }
  } else if (preferredAlignX === 'start') {
    alignResult = 'start';
    vpLeft = Math.max(pad, Math.min(vw - pad - overlayWidth, startLeft));
    nudgeX = vpLeft - startLeft;
  } else {
    // 'end'
    alignResult = 'end';
    vpLeft = Math.max(pad, Math.min(vw - pad - overlayWidth, endLeft));
    nudgeX = vpLeft - endLeft;
  }

  // Convert viewport-relative → parent-relative (subtract parent's left in viewport)
  const parentLeft = triggerRect.left; // trigger IS the parent child; parent BoundingRect.left is what we want
  // Actually: overlay is absolute inside the trigger wrapper.
  // The trigger wrapper's left in viewport = triggerRect.left (since trigger fills wrapper, or is the wrapper).
  // overlay's css `left` = vpLeft - triggerRect.left (the wrapper's viewport left)
  const cssLeft = vpLeft - triggerRect.left;

  /* ── transformOrigin ─────────────────────────────────────────── */
  const transformOrigin = side === 'bottom' ? 'top center' : 'bottom center';

  return { side, left: cssLeft, nudgeX, align: alignResult, transformOrigin };
}

/* ──────────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────────── */

export function LiquidOverlayCard({
  isVisible,
  accentColor = 'rgba(255,255,255,0.35)',
  title,
  subtitle,
  sections = [],
  children,
  position = 'auto',
  alignX = 'auto',
  maxWidth = 320,
  minWidth = 200,
  gap = 8,
  viewportPadding = 12,
  showArrow = false,
  interactive = false,
}: LiquidOverlayCardProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);

  const computeAndSet = () => {
    const el = overlayRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const triggerRect = parent.getBoundingClientRect();
    // Measure actual rendered size (the overlay is in the DOM hidden)
    const elRect = el.getBoundingClientRect();
    const overlayWidth = elRect.width || Math.min(maxWidth, window.innerWidth - viewportPadding * 2);
    const overlayHeight = elRect.height || el.scrollHeight || 300;

    const p = computePlacement(triggerRect, overlayWidth, overlayHeight, gap, viewportPadding, position, alignX);
    setPlacement(p);
  };

  // Recompute whenever visibility changes or on scroll/resize
  useLayoutEffect(() => {
    if (!isVisible) return;
    computeAndSet();

    window.addEventListener('scroll', computeAndSet, { passive: true, capture: true });
    window.addEventListener('resize', computeAndSet, { passive: true });
    return () => {
      window.removeEventListener('scroll', computeAndSet, true);
      window.removeEventListener('resize', computeAndSet);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, maxWidth, gap, viewportPadding, position, alignX]);

  // Also recompute after mount (content may have changed height)
  useEffect(() => {
    if (isVisible) computeAndSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, children, sections]);

  /* ── Styles ────────────────────────────────────────────────── */
  const overlayStyle: CSSProperties = {
    position: 'absolute',
    zIndex: 50,
    width: 'max-content',
    minWidth: minWidth,
    maxWidth: `min(${maxWidth}px, calc(100vw - ${viewportPadding * 2}px))`,
    pointerEvents: interactive ? 'auto' : 'none',
    // Placement applied once computed
    ...(placement
      ? {
          left: placement.left,
          ...(placement.side === 'bottom'
            ? { top: `calc(100% + ${gap}px)` }
            : { bottom: `calc(100% + ${gap}px)` }),
        }
      : {
          // Hidden until placement computed — render off-screen to measure
          top: `calc(100% + ${gap}px)`,
          left: 0,
          visibility: 'hidden',
        }),
  };

  const motionProps = placement
    ? {
        initial: { opacity: 0, scale: 0.95, y: placement.side === 'bottom' ? -6 : 6 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit:    { opacity: 0, scale: 0.95, y: placement.side === 'bottom' ? -6 : 6 },
        style: { transformOrigin: placement.transformOrigin },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 0 },
        exit:    { opacity: 0 },
      };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={overlayRef}
          style={overlayStyle}
          {...motionProps}
          transition={springConfigs.snappy}
        >
          {/* Arrow */}
          {showArrow && placement && (
            <Arrow side={placement.side} accentColor={accentColor} />
          )}

          {/* Glass card */}
          <GlassBody
            accentColor={accentColor}
            title={title}
            subtitle={subtitle}
            sections={sections}
            hasArrowAbove={showArrow && placement?.side === 'bottom'}
            hasArrowBelow={showArrow && placement?.side === 'top'}
          >
            {children}
          </GlassBody>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────────────────────────────────────────────────
   ARROW
────────────────────────────────────────────────────────────────── */

function Arrow({ side, accentColor }: { side: Side; accentColor: string }) {
  // Arrow points toward the trigger (opposite of overlay side)
  const isBelow = side === 'bottom'; // overlay is below trigger → arrow points UP

  const style: CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    zIndex: 1,
    ...(isBelow
      ? {
          top: -ARROW_SIZE,
          borderLeft: `${ARROW_SIZE}px solid transparent`,
          borderRight: `${ARROW_SIZE}px solid transparent`,
          borderBottom: `${ARROW_SIZE}px solid rgba(12,12,16,0.92)`,
        }
      : {
          bottom: -ARROW_SIZE,
          borderLeft: `${ARROW_SIZE}px solid transparent`,
          borderRight: `${ARROW_SIZE}px solid transparent`,
          borderTop: `${ARROW_SIZE}px solid rgba(12,12,16,0.92)`,
        }),
  };

  return <div style={style} />;
}

/* ──────────────────────────────────────────────────────────────────
   GLASS BODY
────────────────────────────────────────────────────────────────── */

function GlassBody({
  accentColor = 'rgba(255,255,255,0.35)',
  title,
  subtitle,
  sections,
  children,
  hasArrowAbove,
  hasArrowBelow,
}: Pick<LiquidOverlayCardProps, 'accentColor' | 'title' | 'subtitle' | 'sections' | 'children'> & {
  hasArrowAbove?: boolean;
  hasArrowBelow?: boolean;
}) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 24,
        overflow: 'hidden',
        background: 'rgba(12,12,16,0.92)',
        backdropFilter: 'blur(32px) saturate(150%)',
        WebkitBackdropFilter: 'blur(32px) saturate(150%)',
        border: `0.5px solid ${accentColor}44`,
        boxShadow: `
          0 20px 64px rgba(0,0,0,0.60),
          0 4px 20px rgba(0,0,0,0.35),
          inset 0 0 0 0.5px rgba(255,255,255,0.06),
          inset 0 0.5px 0 rgba(255,255,255,0.16)
        `,
        marginTop: hasArrowAbove ? ARROW_SIZE : 0,
        marginBottom: hasArrowBelow ? ARROW_SIZE : 0,
      }}
    >
      {/* Lensing highlight */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 24,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse 120% 50% at 50% -5%, ${accentColor}18 0%, transparent 55%)`,
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, padding: 16 }}>
        {(title || subtitle) && (
          <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
            {title && (
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                {title}
              </h4>
            )}
            {subtitle && (
              <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>
                {subtitle}
              </p>
            )}
          </div>
        )}

        {sections && sections.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {sections.map((section, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  {section.icon && (
                    <span style={{ color: section.color || accentColor, display: 'flex' }}>
                      {section.icon}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: section.color || accentColor,
                    }}
                  >
                    {section.title}
                  </span>
                </div>
                {section.content}
              </div>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

LiquidOverlayCard.displayName = 'LiquidOverlayCard';

/* ──────────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────────────── */

export interface LiquidOverlayListItemProps {
  children: ReactNode;
  color?: string;
}

export function LiquidOverlayListItem({ children, color }: LiquidOverlayListItemProps) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 500,
        padding: '6px 10px',
        borderRadius: 8,
        marginBottom: 4,
        background: color ? `${color}14` : 'rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.82)',
        border: color ? `0.5px solid ${color}28` : '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      {children}
    </div>
  );
}

export interface LiquidOverlayScriptBlockProps {
  lines: string[];
  color?: string;
  maxHeight?: number;
}

export function LiquidOverlayScriptBlock({
  lines,
  color = '#3b82f6',
  maxHeight = 128,
}: LiquidOverlayScriptBlockProps) {
  return (
    <div
      style={{
        fontSize: 11,
        fontFamily: 'monospace',
        lineHeight: 1.6,
        padding: 10,
        borderRadius: 10,
        overflowY: 'auto',
        maxHeight,
        background: `${color}12`,
        color: 'rgba(255,255,255,0.72)',
        border: `0.5px solid ${color}28`,
      }}
    >
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   RE-EXPORTS (keep API surface compatible)
────────────────────────────────────────────────────────────────── */

export type { LiquidOverlaySection as OverlaySection };
