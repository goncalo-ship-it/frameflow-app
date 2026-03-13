// Logo FrameFlow — imagem PNG oficial
export function FrameFlowLogo({ size = 32 }) {
  return (
    <img
      src="/FrameFlow_Logo.png"
      alt="FrameFlow"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block', flexShrink: 0 }}
    />
  )
}

// Re-export with old name for backward compatibility
export { FrameFlowLogo as FlameboardLogo }
