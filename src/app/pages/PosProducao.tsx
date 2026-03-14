/**
 * PÓS-PRODUÇÃO — HUB / OVERVIEW
 * Pipeline completo de pós-produção
 */

import { LiquidPage, LiquidCard, LiquidSection, LiquidStatCard, LiquidBadge } from '../components/liquid-system';
import { PosNavPills } from '../components/PosNavPills';

const ACCENT = '#a855f7';

const PIPELINE_CARDS = [
  {
    id: 'dailies',
    label: 'Dailies',
    status: 'concluído',
    statusColor: '#10b981',
    progress: 100,
    description: 'Todos os rushes do dia ingeridos e organizados por cena e take.',
  },
  {
    id: 'pos-selects',
    label: 'Selects',
    status: 'em progresso',
    statusColor: '#f59e0b',
    progress: 55,
    description: 'Revisão de takes pelo realizador — director circles e selecções.',
  },
  {
    id: 'pos-montagem',
    label: 'Montagem',
    status: 'pendente',
    statusColor: 'rgba(255,255,255,0.35)',
    progress: 12,
    description: 'Assembly cut em progresso — timeline por episódio.',
  },
  {
    id: 'pos-vfx',
    label: 'VFX',
    status: 'pendente',
    statusColor: 'rgba(255,255,255,0.35)',
    progress: 0,
    description: 'Compositing, motion graphics e efeitos visuais.',
  },
  {
    id: 'pos-cor',
    label: 'Color',
    status: 'pendente',
    statusColor: 'rgba(255,255,255,0.35)',
    progress: 0,
    description: 'Grade e look development — DaVinci Resolve.',
  },
  {
    id: 'pos-som',
    label: 'Sound Mix',
    status: 'pendente',
    statusColor: 'rgba(255,255,255,0.35)',
    progress: 0,
    description: 'Mix final, ADR, Foley e deliverables de áudio.',
  },
];

const MILESTONES = [
  { date: '20 Mar 2026', label: 'Selects EP01 aprovados',    color: '#f59e0b' },
  { date: '05 Abr 2026', label: 'Assembly cut EP01 pronto',  color: ACCENT },
  { date: '02 Mai 2026', label: 'Fine cut todos episódios',  color: ACCENT },
  { date: '15 Jun 2026', label: 'Entrega final RTP2',        color: '#10b981' },
];

export function PosProducaoModule() {
  return (
    <LiquidPage
      title="Pós-Produção"
      description="Pipeline completo"
      section="pos"
    >
      <PosNavPills activeTab="pos" onTabChange={() => {}} />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
        <LiquidStatCard label="Dias rodagem"   value={32}    accent={ACCENT} />
        <LiquidStatCard label="Cenas gravadas" value={47}    accent={ACCENT} />
        <LiquidStatCard label="Selects"        value={89}    accent="#f59e0b" />
        <LiquidStatCard label="VFX shots"      value={23}    accent="#3b82f6" />
        <LiquidStatCard label="Color"          value="12%"   accent="#ec4899" />
        <LiquidStatCard label="Mix"            value="5%"    accent="#06b6d4" />
      </div>

      {/* Pipeline status grid */}
      <LiquidSection title="Pipeline" accent={ACCENT}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {PIPELINE_CARDS.map((card) => (
            <div
              key={card.id}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(255,255,255,0.10)',
                borderRadius: 16,
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{card.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: `${card.statusColor}20`,
                    color: card.statusColor,
                    border: `0.5px solid ${card.statusColor}40`,
                    textTransform: 'capitalize',
                  }}
                >
                  {card.status}
                </span>
              </div>

              {/* Description */}
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                {card.description}
              </p>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>Progresso</span>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 600 }}>
                    {card.progress}%
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${card.progress}%`,
                      borderRadius: 999,
                      background:
                        card.progress === 100
                          ? '#10b981'
                          : card.progress > 10
                          ? `linear-gradient(90deg, ${ACCENT}, #9333ea)`
                          : 'rgba(255,255,255,0.2)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </LiquidSection>

      {/* Próximas Entregas */}
      <LiquidCard>
        <div style={{ marginBottom: 14 }}>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>Próximas Entregas</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MILESTONES.map((m, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '0.5px solid rgba(255,255,255,0.07)',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: m.color,
                  boxShadow: `0 0 6px ${m.color}80`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  minWidth: 90,
                  flexShrink: 0,
                }}
              >
                {m.date}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500 }}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </LiquidCard>
    </LiquidPage>
  );
}
