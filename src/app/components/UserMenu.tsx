/**
 * UserMenu — FrameFlow Liquid Glass
 * Adapted from Ffv04copy: useAuth() → useStore, useNavigate() → store.navigate,
 * useTheme() removed (no ThemeContext in FF02)
 */

import { forwardRef, useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Settings, LogOut, User } from 'lucide-react';
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

    const handleLogout = () => {
      setIsOpen(false);
      if (typeof logout === 'function') logout();
    };

    const handleSettings = () => {
      setIsOpen(false);
      if (typeof navigate === 'function') navigate('settings');
    };

    return (
      <div ref={menuRef} className={clsx('relative', className)}>
        {/* Avatar button */}
        <button
          onClick={() => setIsOpen(v => !v)}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200',
            isOpen && 'ring-1 ring-[#10b981]/50'
          )}
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            border: '0.5px solid rgba(255,255,255,0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08), inset 0 0.5px 0.5px rgba(255,255,255,0.20)',
            minHeight: 40,
          }}
        >
          {/* Initials circle */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-[12px] flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(16,185,129,0.4)',
            }}
          >
            {userInitials}
          </div>
          {/* Name (hidden on xs) */}
          <div className="hidden sm:block text-left">
            <div className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.90)' }}>
              {userName.split(' ')[0]}
            </div>
            {userRole && (
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {userRole}
              </div>
            )}
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={ref}
            className="absolute right-0 top-full mt-2 w-64 rounded-[18px] overflow-hidden z-50"
            style={{
              background: 'rgba(18,22,34,0.92)',
              backdropFilter: 'blur(40px) saturate(160%)',
              WebkitBackdropFilter: 'blur(40px) saturate(160%)',
              border: '0.5px solid rgba(255,255,255,0.18)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(255,255,255,0.18)',
            }}
          >
            {/* Inner top highlight */}
            <div
              className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28) 50%, transparent)' }}
            />

            {/* Header */}
            <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.09)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px]"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff' }}
                >
                  {userInitials}
                </div>
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    {userName}
                  </div>
                  {userRole && (
                    <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {userRole}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Menu actions */}
            <div className="py-1">
              <button
                onClick={handleSettings}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                style={{ background: 'transparent', color: 'rgba(255,255,255,0.80)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Settings className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.50)' }} />
                <span className="text-[13px]">Definições</span>
              </button>

              <div className="mx-4 my-1" style={{ borderTop: '0.5px solid rgba(255,255,255,0.09)' }} />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                style={{ background: 'transparent', color: '#ef4444' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
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
