/**
 * UserMenu — FrameFlow Liquid Glass
 * Spec: menu_espero.md §14-15
 */

import { forwardRef, useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Settings, LogOut, Sun, Moon, Sparkles } from 'lucide-react';
// @ts-expect-error JSX module
import { useStore } from '../../core/store';
// @ts-expect-error JSX module
import { useShallow } from 'zustand/react/shallow';

interface UserMenuProps {
  className?: string;
}

export const UserMenu = forwardRef<HTMLDivElement, UserMenuProps>(
  ({ className }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [theme, setThemeState] = useState(() =>
      document.documentElement.getAttribute('data-theme') || 'dark'
    );
    const menuRef = useRef<HTMLDivElement>(null);

    const { auth, logout, navigate } = useStore(useShallow((s: any) => ({
      auth: s.auth,
      logout: s.logout,
      navigate: s.navigate,
    })));

    const userName     = auth?.user?.name || auth?.user?.email || 'GPS';
    const userRole     = auth?.user?.role || auth?.role || '';
    const userInitials = userName.split(' ').map((w: string) => w[0] || '').join('').slice(0, 2).toUpperCase() || 'FF';

    // Close on outside click
    useEffect(() => {
      if (!isOpen) return;
      const handler = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const handleTheme = (newTheme: string) => {
      setThemeState(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      window.dispatchEvent(new CustomEvent('theme-updated'));
    };

    const handleLogout = () => {
      setIsOpen(false);
      if (typeof logout === 'function') logout();
    };

    const handleSettings = () => {
      setIsOpen(false);
      if (typeof navigate === 'function') navigate('settings');
    };

    const THEME_OPTIONS = [
      { value: 'light', icon: Sun,      label: 'Light' },
      { value: 'dark',  icon: Moon,     label: 'Dark'  },
      { value: 'auto',  icon: Sparkles, label: 'Auto'  },
    ] as const;

    return (
      <div ref={menuRef} className={clsx('relative', className)}>

        {/* ── Avatar button ── */}
        <button
          onClick={() => setIsOpen(v => !v)}
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200',
            isOpen && 'ring-1 ring-[#10b981]/50'
          )}
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            border: '0.5px solid rgba(255,255,255,0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08), inset 0 0.5px 0.5px rgba(255,255,255,0.20)',
            minHeight: 44,
            cursor: 'pointer',
          }}
        >
          {/* Initials circle — w-8 h-8 per spec */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[13px] flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(16,185,129,0.4)',
            }}
          >
            {userInitials}
          </div>

          {/* Name + Role — hidden below 1024px per TOPBAR-STANDALONE spec */}
          <div className="hidden lg:block text-left">
            <div className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {userName}
            </div>
            {userRole && (
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {userRole}
              </div>
            )}
          </div>
        </button>

        {/* ── Dropdown ── */}
        {isOpen && (
          <div
            ref={ref}
            className="absolute right-0 top-full mt-2 w-72 rounded-xl overflow-hidden z-50"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px) saturate(120%)',
              WebkitBackdropFilter: 'blur(20px) saturate(120%)',
              border: '0.5px solid rgba(255,255,255,0.18)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 0.5px 0.5px rgba(255,255,255,0.2)',
            }}
          >

            {/* Section 1 — User info */}
            <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.09)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-[15px] flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff' }}
                >
                  {userInitials}
                </div>
                <div>
                  <div className="text-[14px] font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    {userName}
                  </div>
                  {userRole && (
                    <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {userRole}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2 — Theme toggle */}
            <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.09)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
                <span className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Tema
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map(({ value, icon: Icon, label }) => {
                  const active = theme === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleTheme(value)}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200"
                      style={{
                        border: active ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.09)',
                        background: active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                        color: active ? '#10b981' : 'rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[11px] font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>
              {theme === 'auto' && (
                <div
                  className="mt-3 p-2.5 rounded-lg text-[11px]"
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  <Sparkles
                    className="w-3 h-3 inline mr-1.5"
                    style={{ color: '#10b981', verticalAlign: 'middle' }}
                  />
                  Modo automático: Dark de 19h–7h, Light de dia
                </div>
              )}
            </div>

            {/* Section 3 — Actions */}
            <div className="py-1">
              <button
                onClick={handleSettings}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                style={{ background: 'transparent', color: 'rgba(255,255,255,0.80)', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Settings className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.50)' }} />
                <span className="text-[13px]">Todas as Definições</span>
              </button>

              <div className="mx-4 my-1" style={{ borderTop: '0.5px solid rgba(255,255,255,0.09)' }} />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444' }} />
                <span className="text-[13px]">Terminar Sessão</span>
              </button>
            </div>

          </div>
        )}
      </div>
    );
  }
);

UserMenu.displayName = 'UserMenu';
