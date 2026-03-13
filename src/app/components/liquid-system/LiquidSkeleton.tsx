/**
 * LIQUID SKELETON — Loading shimmer
 * shimmer: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)
 * backgroundSize: 200% 100%, animation: liquid-shimmer 1.8s infinite
 */

export interface LiquidSkeletonProps {
  width?:   string | number;
  height?:  string | number;
  radius?:  string | number;
  className?: string;
}

export function LiquidSkeleton({
  width   = '100%',
  height  = 16,
  radius  = 8,
  className = '',
}: LiquidSkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'liquid-shimmer 1.8s ease-in-out infinite',
      }}
    />
  );
}

/** Block of skeletons for a card */
export function LiquidSkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <LiquidSkeleton height={12} width="60%" radius={6} />
      {Array.from({ length: lines }).map((_, i) => (
        <LiquidSkeleton key={i} height={10} width={i === lines - 1 ? '75%' : '100%'} radius={5} />
      ))}
    </div>
  );
}

LiquidSkeleton.displayName = 'LiquidSkeleton';
