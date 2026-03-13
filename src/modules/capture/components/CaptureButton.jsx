// CaptureButton.jsx — FAB visual with CaptureDrawer integration
// Uses the shared FAB component for the Figma-spec floating button

import { useState } from 'react'
import { FAB } from '../../../components/shared/FAB.jsx'
import { useCapture } from '../hooks/useCapture.js'
import { CaptureDrawer } from './CaptureDrawer.jsx'

export function CaptureButton() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { inboxCount, offlineQueue } = useCapture()

  const queueCount = offlineQueue?.length || 0
  const totalBadge = inboxCount + queueCount

  return (
    <>
      <FAB
        onAction={() => setDrawerOpen(true)}
        badge={totalBadge}
      />
      <CaptureDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  )
}
