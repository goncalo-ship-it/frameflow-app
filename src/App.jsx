import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react' // motion kept for wallpaper/offline use
import { useStore } from './core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { resolvePanel } from './core/roles.js'
import { initReactiveCore } from './core/reactive.js'
import { SidebarNew } from './app/components/SidebarNew.tsx'
import { Topbar } from './app/components/Topbar.tsx'
import { PreviewBanner } from './components/shared/PreviewBanner.jsx'
import { ReactiveToast } from './components/shared/ReactiveToast.jsx'
import { MobileBottomNav } from './app/components/MobileBottomNav.tsx'
import { PWAInstallPrompt } from './components/shared/PWAInstallPrompt.jsx'
import { UniversalUpload } from './components/shared/UniversalUpload.jsx'
import { LoginScreen } from './roles/LoginScreen.jsx'
import { JoinScreen } from './roles/JoinScreen.jsx'
import { AppShell } from './AppShell.jsx'
import { CaptureButton } from './modules/capture/index.jsx'
import { SuperAdminPanel } from './panels/SuperAdminPanel.jsx'
import { BackgroundOrbs } from './components/shared/BackgroundOrbs.jsx'
import './index.css'

const DevSeed = lazy(() => import('./dev/DevSeed.jsx').then(m => ({ default: m.DevSeed })))

export default function App() {
  useEffect(() => { initReactiveCore() }, [])
  const {  auth, login, wallpaper, navigate  } = useStore(useShallow(s => ({ auth: s.auth, login: s.login, wallpaper: s.wallpaper, navigate: s.navigate })))
  const theme = auth.theme || 'dark'

  // ?seed → página de seed para desenvolvimento
  const isSeedMode = useMemo(() => new URLSearchParams(window.location.search).has('seed'), [])

  // ?module=X → deep link from PWA shortcuts
  const deepLinkModule = useMemo(() => new URLSearchParams(window.location.search).get('module'), [])

  // ?reset → limpa localStorage e recarrega
  // ?admin → auto-login como Super Admin
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('reset')) {
      localStorage.removeItem('frame-v1')
      window.location.href = window.location.pathname
      return
    }
    if (params.has('admin') && !auth.isAuthenticated) {
      login(
        { name: 'GPS', email: 'superadmin@flameboard.pt', photo: null, uid: null },
        'director_producao',
        null,
        true
      )
      window.history.replaceState({}, '', window.location.pathname)
    }
    // PWA shortcut deep link — navigate after auth
    if (deepLinkModule && auth.isAuthenticated) {
      navigate(deepLinkModule)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [auth.isAuthenticated])

  // Auto-seed removed — use "Carregar Dados Demo" in Settings to seed manually

  // Offline indicator
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Apply theme to <html> so CSS [data-theme="light"] works
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Wallpaper — set CSS custom properties on :root
  useEffect(() => {
    const root = document.documentElement
    const wp = wallpaper || {}
    root.style.setProperty('--glass-opacity', String(wp.opacity ?? 0.85))
    root.style.setProperty('--glass-blur', `${wp.blur ?? 20}px`)
  }, [wallpaper])

  // Detect invite token from URL (?join=TOKEN or #join=TOKEN)
  const joinToken = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('join')) return params.get('join')
    const hash = window.location.hash
    if (hash.startsWith('#join=')) return hash.slice(6)
    return null
  }, [])

  // Seed mode — bypass login
  if (isSeedMode) {
    return (
      <Suspense fallback={<div style={{ color: '#fff', padding: 40 }}>A carregar DevSeed…</div>}>
        <DevSeed />
      </Suspense>
    )
  }

  // Join flow takes priority over normal login
  if (joinToken && !auth.isAuthenticated) {
    return <JoinScreen token={joinToken} />
  }

  if (!auth.isAuthenticated) {
    return <LoginScreen />
  }

  const panel = resolvePanel(auth)
  const hasPreview = auth.previewPanel || auth.previewRole
  const topOffset = hasPreview ? 32 : 0

  // Painel 1 — Super Admin
  if (panel === 'superadmin') {
    return <SuperAdminPanel />
  }

  const offlineBanner = offline ? (
    <div style={{
      position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', alignItems: 'center', gap: 8,
      background: 'rgba(20, 24, 32, 0.92)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '0.5px solid rgba(217,119,6,0.5)',
      borderRadius: 999, padding: '7px 16px',
      color: '#FBBF24', fontSize: 12, fontWeight: 600,
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(217,119,6,0.15)',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FBBF24', flexShrink: 0 }} />
      Offline — alterações guardadas localmente
    </div>
  ) : null

  const offlineHeight = offline ? 0 : 0

  // Painel 2 (management) e Painel 3 (roleview) partilham Sidebar + AppShell
  // A diferença está nos módulos visíveis (filtrados pelo canAccess) e no dashboard
  const wpActive = wallpaper?.type && wallpaper.type !== 'none'

  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  return (
    <>
      {offlineBanner}
      {hasPreview && <PreviewBanner />}
      {!wpActive && <BackgroundOrbs />}
      {wpActive && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0,
          backgroundImage: wallpaper.type === 'gradient' ? wallpaper.gradient
            : `url(${wallpaper.type === 'preset' ? `/wallpapers/${wallpaper.preset}.jpg` : wallpaper.customUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `rgba(0,0,0,${wallpaper.dim ?? 0.3})`,
          }} />
        </div>
      )}
      <UniversalUpload>
        <div className="app-layout" style={{
          display: 'flex',
          height: hasPreview ? `calc(100vh - ${32 + offlineHeight}px)` : `calc(100vh - ${offlineHeight}px)`,
          marginTop: topOffset + offlineHeight,
          width: '100vw',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Sidebar — sempre visível */}
          <SidebarNew expanded={sidebarExpanded} onToggleExpand={() => setSidebarExpanded(v => !v)} />

          {/* MAIN AREA — stacking context z-10, topbar at z-30, scroll <main> sem z-index */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, position: 'relative', zIndex: 10 }}>
            {/* TOPBAR WRAPPER — z-30 garante que fica acima do conteúdo scrollado */}
            <div style={{ position: 'relative', zIndex: 30, flexShrink: 0 }}>
              <Topbar />
              {/* Fade gradient — transição suave entre topbar e scroll */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 16, transform: 'translateY(100%)',
                background: 'linear-gradient(to bottom, rgba(23,29,44,0.5), transparent)',
                pointerEvents: 'none', zIndex: 1,
              }} />
            </div>
            <AppShell />
          </div>{/* /MAIN AREA */}
          <CaptureButton />
          <ReactiveToast />
          <MobileBottomNav />
          <PWAInstallPrompt />
        </div>
      </UniversalUpload>
    </>
  )
}
