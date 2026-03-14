/**
 * PosNavPills — Horizontal pill navigation for post-production pages
 */

// @ts-expect-error JSX module
import { useStore } from '../../core/store';
// @ts-expect-error JSX module
import { useShallow } from 'zustand/react/shallow';

interface PosNavPillsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const PILLS = [
  { id: 'pos',          label: 'Overview',  color: '#a855f7' },
  { id: 'dailies',      label: 'Dailies',   color: '#a855f7' },
  { id: 'pos-selects',  label: 'Selects',   color: '#a855f7' },
  { id: 'pos-montagem', label: 'Montagem',  color: '#a855f7' },
  { id: 'pos-vfx',      label: 'VFX',       color: '#a855f7' },
  { id: 'pos-cor',      label: 'Color',     color: '#a855f7' },
  { id: 'pos-som',      label: 'Sound Mix', color: '#a855f7' },
];

export function PosNavPills({ activeTab, onTabChange }: PosNavPillsProps) {
  const { navigate } = useStore(useShallow((s: any) => ({
    navigate: s.navigate,
  })));

  const handleClick = (id: string) => {
    navigate(id);
    onTabChange(id);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        paddingBottom: 4,
        marginBottom: 20,
        scrollbarWidth: 'none',
      }}
    >
      {PILLS.map((pill) => {
        const isActive = activeTab === pill.id;
        return (
          <button
            key={pill.id}
            onClick={() => handleClick(pill.id)}
            style={{
              flexShrink: 0,
              padding: '7px 16px',
              borderRadius: 999,
              border: isActive ? 'none' : `0.5px solid rgba(168,85,247,0.2)`,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: isActive ? 700 : 500,
              background: isActive
                ? 'linear-gradient(135deg, #a855f7, #9333ea)'
                : 'rgba(168,85,247,0.08)',
              color: isActive ? '#ffffff' : 'rgba(168,85,247,0.7)',
              boxShadow: isActive
                ? '0 0 12px rgba(168,85,247,0.45), 0 2px 8px rgba(168,85,247,0.3)'
                : 'none',
              transition: 'all 0.15s ease',
              outline: 'none',
            }}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}
