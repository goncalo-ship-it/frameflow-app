// Logo FrameFlow — viewfinder de cinema com cantos de enquadramento
export function FrameFlowLogo({ size = 32, color = 'currentColor' }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Frame exterior */}
      <rect x="4" y="7" width="32" height="26" rx="2.5" stroke="var(--text-primary, #E8EDF5)" strokeWidth="1.5" fill="none" opacity="0.3"/>
      {/* Corner brackets — viewfinder */}
      <path d="M4 15V9.5A2.5 2.5 0 0 1 6.5 7H12" stroke="var(--accent, #2E6FA0)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M36 15V9.5A2.5 2.5 0 0 0 33.5 7H28" stroke="var(--accent, #2E6FA0)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M4 25v5.5A2.5 2.5 0 0 0 6.5 33H12" stroke="var(--accent, #2E6FA0)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M36 25v5.5a2.5 2.5 0 0 1-2.5 2.5H28" stroke="var(--accent, #2E6FA0)" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Center dot */}
      <circle cx="20" cy="20" r="2" fill="var(--accent, #2E6FA0)"/>
      {/* Horizontal crosshair lines */}
      <line x1="14" y1="20" x2="17" y2="20" stroke="var(--accent, #2E6FA0)" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <line x1="23" y1="20" x2="26" y2="20" stroke="var(--accent, #2E6FA0)" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

// Re-export with old name for backward compatibility
export { FrameFlowLogo as FlameboardLogo }
