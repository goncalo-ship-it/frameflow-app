/**
 * EQUIPMENT — Gestão de material técnico
 * C1 — Liquid Glass Design System
 * Categorias, check-out/in, histórico, AI auto-categorize
 */

import { useState, useRef, useMemo, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera, Mic, Lightbulb, Package, Truck, Box,
  Plus, Search, CheckCircle2, AlertTriangle, X,
  ArrowLeftRight, History, Trash2, RotateCcw, User,
  Calendar, StickyNote,
} from 'lucide-react';
import { useStore } from '../../core/store.js';
import { useShallow } from 'zustand/react/shallow';
import {
  LiquidPage, LiquidCard, LiquidButton,
  LiquidInput, LiquidTabs, LiquidSection, LiquidStatCard,
} from '../components/liquid-system';
import {
  glassCard, lensingOverlay, nestedCard, iconGradient,
  hexToRgb, springConfigs,
} from '../utils/liquidGlassStyles';
import { fetchAPI, MODEL_FAST } from '../../core/api.js';

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { id: 'all',       label: 'Tudo',       icon: Box,       color: '#ffffff' },
  { id: 'camera',    label: 'Câmara',     icon: Camera,    color: '#10b981' },
  { id: 'sound',     label: 'Som',        icon: Mic,       color: '#f59e0b' },
  { id: 'lighting',  label: 'Luz',        icon: Lightbulb, color: '#f97316' },
  { id: 'grip',      label: 'Grip',       icon: Package,   color: '#94a3b8' },
  { id: 'transport', label: 'Transporte', icon: Truck,     color: '#3b82f6' },
  { id: 'misc',      label: 'Outros',     icon: Box,       color: '#a855f7' },
] as const;

type Category = typeof CATEGORIES[number]['id'];

const STATUS_COLORS: Record<string, string> = {
  available:    '#10b981',
  'checked-out':'#f59e0b',
  maintenance:  '#f97316',
  missing:      '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  available:    'Disponível',
  'checked-out':'Em uso',
  maintenance:  'Manutenção',
  missing:      'Em falta',
};

const CONDITION_COLORS: Record<string, string> = {
  excellent: '#10b981',
  good:      '#3b82f6',
  fair:      '#f59e0b',
  poor:      '#ef4444',
};

const CONDITION_LABELS: Record<string, string> = {
  excellent: 'Excelente',
  good:      'Bom',
  fair:      'Razoável',
  poor:      'Mau',
};

const CATEGORY_COLOR: Record<string, string> = Object.fromEntries(
  CATEGORIES.filter(c => c.id !== 'all').map(c => [c.id, c.color])
);

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

interface CheckOut {
  id: string;
  memberId?: string;
  memberName: string;
  checkedOutAt: string;
  dueBack?: string;
  returnedAt?: string;
  notes?: string;
}

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  dept?: string;
  status: string;
  photo?: string;
  quantity: number;
  serialNumber?: string;
  condition: string;
  notes?: string;
  checkOuts: CheckOut[];
  createdAt: string;
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

function isOverdue(item: EquipmentItem): boolean {
  const active = item.checkOuts.find(c => !c.returnedAt);
  if (!active?.dueBack) return false;
  return new Date(active.dueBack) < new Date();
}

function getActiveCheckOut(item: EquipmentItem): CheckOut | undefined {
  return item.checkOuts.find(c => !c.returnedAt);
}

function fmtDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/* ─────────────────────────────────────────────────────────────
   EQUIPMENT ROW
───────────────────────────────────────────────────────────── */

function EquipmentRow({
  item, index,
  onCheckout, onReturn, onHistory, onDelete,
}: {
  item: EquipmentItem;
  index: number;
  onCheckout: () => void;
  onReturn: () => void;
  onHistory: () => void;
  onDelete: () => void;
}) {
  const catColor   = CATEGORY_COLOR[item.category] || '#ffffff';
  const statusColor = STATUS_COLORS[item.status] || '#ffffff';
  const condColor   = CONDITION_COLORS[item.condition] || '#ffffff';
  const active      = getActiveCheckOut(item);
  const overdue     = isOverdue(item);
  const CatIcon     = CATEGORIES.find(c => c.id === item.category)?.icon || Box;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springConfigs.gentle, delay: index * 0.04 }}
    >
      <div
        style={{
          ...nestedCard(catColor, 'subtle'),
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Photo or icon */}
        <div style={{ flexShrink: 0 }}>
          {item.photo ? (
            <img
              src={item.photo}
              alt={item.name}
              style={{
                width: 44, height: 44,
                borderRadius: 10,
                objectFit: 'cover',
                border: `0.5px solid rgba(${hexToRgb(catColor)}, 0.3)`,
              }}
            />
          ) : (
            <div style={iconGradient(catColor, 'md')}>
              <CatIcon size={18} style={{ color: catColor }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 14 }}>
              {item.name}
            </span>
            {/* Status badge */}
            <span style={{
              padding: '2px 8px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 700,
              background: `rgba(${hexToRgb(statusColor)}, 0.15)`,
              border: `0.5px solid rgba(${hexToRgb(statusColor)}, 0.4)`,
              color: statusColor,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              {overdue && <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#ef4444', display: 'inline-block' }} className="animate-pulse" />}
              {STATUS_LABELS[item.status] || item.status}
            </span>
            {/* Condition dot */}
            <span style={{
              width: 7, height: 7,
              borderRadius: 9999,
              background: condColor,
              boxShadow: `0 0 6px ${condColor}`,
              display: 'inline-block',
              flexShrink: 0,
            }} title={CONDITION_LABELS[item.condition]} />
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {item.serialNumber && (
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                S/N {item.serialNumber}
              </span>
            )}
            {item.quantity > 1 && (
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                × {item.quantity}
              </span>
            )}
            {active && (
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                {active.memberName}{active.dueBack ? ` · devolve ${fmtDate(active.dueBack)}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
          {item.status === 'checked-out' ? (
            <button
              onClick={onReturn}
              style={{
                padding: '6px 12px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                background: `rgba(${hexToRgb('#10b981')}, 0.15)`,
                border: `0.5px solid rgba(${hexToRgb('#10b981')}, 0.4)`,
                color: '#10b981',
              }}
            >
              <RotateCcw size={12} style={{ display: 'inline', marginRight: 4 }} />
              Devolver
            </button>
          ) : (
            <button
              onClick={onCheckout}
              disabled={item.status !== 'available'}
              style={{
                padding: '6px 12px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                cursor: item.status === 'available' ? 'pointer' : 'not-allowed',
                background: item.status === 'available' ? `rgba(${hexToRgb('#f59e0b')}, 0.15)` : 'rgba(255,255,255,0.04)',
                border: item.status === 'available' ? `0.5px solid rgba(${hexToRgb('#f59e0b')}, 0.4)` : '0.5px solid rgba(255,255,255,0.1)',
                color: item.status === 'available' ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                opacity: item.status === 'available' ? 1 : 0.6,
              }}
            >
              <ArrowLeftRight size={12} style={{ display: 'inline', marginRight: 4 }} />
              Check-out
            </button>
          )}
          <button
            onClick={onHistory}
            style={{
              width: 30, height: 30,
              borderRadius: 9999,
              border: '0.5px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <History size={13} />
          </button>
          <button
            onClick={onDelete}
            style={{
              width: 30, height: 30,
              borderRadius: 9999,
              border: '0.5px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.25)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ADD ITEM OVERLAY
───────────────────────────────────────────────────────────── */

function AddItemOverlay({
  onClose, onSave, apiKey,
}: {
  onClose: () => void;
  onSave: (item: Partial<EquipmentItem>) => void;
  apiKey: string;
}) {
  const [name, setName]           = useState('');
  const [category, setCategory]   = useState('misc');
  const [quantity, setQuantity]   = useState('1');
  const [serial, setSerial]       = useState('');
  const [condition, setCondition] = useState('good');
  const [notes, setNotes]         = useState('');
  const [photo, setPhoto]         = useState<string | undefined>();
  const [aiLoading, setAiLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      setPhoto(ev.target?.result as string);
      if (apiKey) {
        setAiLoading(true);
        try {
          const res = await fetchAPI({
            apiKey,
            model: MODEL_FAST,
            system: 'És um assistente de inventário técnico de cinema. Analisa imagens de equipamento e responde APENAS com JSON: { "name": "...", "category": "camera|sound|lighting|grip|transport|misc", "condition": "excellent|good|fair|poor" }',
            messages: [{ role: 'user', content: [
              { type: 'image', source: { type: 'base64', media_type: file.type as 'image/jpeg', data: base64 } },
              { type: 'text', text: 'Identifica este equipamento. Responde apenas com o JSON.' },
            ]}],
            maxTokens: 120,
          });
          const text = res?.content?.[0]?.text || '';
          const match = text.match(/\{[\s\S]*?\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.name && !name) setName(parsed.name);
            if (parsed.category) setCategory(parsed.category);
            if (parsed.condition) setCondition(parsed.condition);
          }
        } catch (_) {}
        setAiLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const valid = name.trim().length > 0;

  const handleSave = () => {
    if (!valid) return;
    onSave({
      name:         name.trim(),
      category,
      quantity:     parseInt(quantity) || 1,
      serialNumber: serial.trim() || undefined,
      condition,
      notes:        notes.trim() || undefined,
      photo,
      status:       'available',
      checkOuts:    [],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={springConfigs.snappy}
        style={{
          ...glassCard({ intensity: 'heavy', radius: 'xl' }),
          padding: 28,
          width: '100%',
          maxWidth: 480,
        }}
      >
        <div style={lensingOverlay()} />
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ color: '#ffffff', fontSize: 18, fontWeight: 800 }}>
              Novo Item
            </h2>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 9999,
                background: 'rgba(255,255,255,0.08)',
                border: '0.5px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Photo upload */}
          <div className="flex items-start gap-4 mb-5">
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: 80, height: 80,
                borderRadius: 14,
                background: photo ? 'transparent' : 'rgba(255,255,255,0.06)',
                border: '0.5px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {photo ? (
                <img src={photo} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Camera size={20} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 600 }}>FOTO</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            <div style={{ flex: 1 }}>
              {aiLoading ? (
                <div style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>
                  IA a identificar equipamento…
                </div>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  {apiKey ? 'Adiciona uma foto — a IA identifica automaticamente o equipamento.' : 'Adiciona uma foto de referência.'}
                </span>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="flex flex-col gap-3">
            <LiquidInput
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome do equipamento *"
              icon={<Package size={14} />}
            />

            {/* Category */}
            <div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                Categoria
              </span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: category === cat.id ? `rgba(${hexToRgb(cat.color)}, 0.2)` : 'rgba(255,255,255,0.04)',
                      border: category === cat.id ? `0.5px solid rgba(${hexToRgb(cat.color)}, 0.5)` : '0.5px solid rgba(255,255,255,0.1)',
                      color: category === cat.id ? cat.color : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                Estado
              </span>
              <div className="flex gap-2">
                {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setCondition(k)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      flex: 1,
                      background: condition === k ? `rgba(${hexToRgb(CONDITION_COLORS[k])}, 0.18)` : 'rgba(255,255,255,0.04)',
                      border: condition === k ? `0.5px solid rgba(${hexToRgb(CONDITION_COLORS[k])}, 0.45)` : '0.5px solid rgba(255,255,255,0.1)',
                      color: condition === k ? CONDITION_COLORS[k] : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <LiquidInput
                  value={serial}
                  onChange={e => setSerial(e.target.value)}
                  placeholder="Nº de série"
                />
              </div>
              <div style={{ width: 80, flexShrink: 0 }}>
                <LiquidInput
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="Qtd."
                  type="number"
                />
              </div>
            </div>

            <LiquidInput
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas"
              icon={<StickyNote size={14} />}
            />
          </div>

          {/* Save */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <LiquidButton variant="default" size="md" onClick={onClose}>Cancelar</LiquidButton>
            <LiquidButton variant="emerald" size="md" disabled={!valid} onClick={handleSave}>Guardar</LiquidButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CHECKOUT OVERLAY
───────────────────────────────────────────────────────────── */

function CheckoutOverlay({
  item, team, onClose, onCheckout,
}: {
  item: EquipmentItem;
  team: any[];
  onClose: () => void;
  onCheckout: (co: Partial<CheckOut>) => void;
}) {
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [dueBack, setDueBack] = useState('');
  const [notes, setNotes] = useState('');

  const filteredTeam = useMemo(() => {
    const q = memberSearch.toLowerCase();
    return team.filter(m => !q || m.name.toLowerCase().includes(q)).slice(0, 8);
  }, [team, memberSearch]);

  const catColor = CATEGORY_COLOR[item.category] || '#f59e0b';

  const handleSubmit = () => {
    if (!selectedMember) return;
    onCheckout({
      memberId:   selectedMember.id,
      memberName: selectedMember.name,
      dueBack:    dueBack || undefined,
      notes:      notes || undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={springConfigs.snappy}
        style={{
          ...glassCard({ intensity: 'heavy', radius: 'xl' }),
          padding: 28,
          width: '100%',
          maxWidth: 420,
        }}
      >
        <div style={lensingOverlay()} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 style={{ color: '#ffffff', fontSize: 17, fontWeight: 800 }}>Check-out</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 }}>{item.name}</p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 9999,
                background: 'rgba(255,255,255,0.08)',
                border: '0.5px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* Member picker */}
            <LiquidInput
              value={memberSearch}
              onChange={e => { setMemberSearch(e.target.value); setSelectedMember(null); }}
              placeholder="Pesquisar membro da equipa…"
              icon={<User size={14} />}
            />

            {selectedMember ? (
              <div style={{
                ...nestedCard(catColor, 'subtle'),
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 14 }}>{selectedMember.name}</span>
                <button onClick={() => setSelectedMember(null)} style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer', background: 'none', border: 'none' }}>
                  <X size={13} />
                </button>
              </div>
            ) : filteredTeam.length > 0 ? (
              <div style={{
                ...glassCard({ intensity: 'subtle', radius: 'md' }),
                maxHeight: 180,
                overflow: 'auto',
              }}>
                {filteredTeam.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMember(m); setMemberSearch(m.name); }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: 13,
                      fontWeight: 600,
                      borderBottom: '0.5px solid rgba(255,255,255,0.06)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    {m.name}
                    {m.role && <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8, fontSize: 11 }}>{m.role}</span>}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Due back */}
            <LiquidInput
              value={dueBack}
              onChange={e => setDueBack(e.target.value)}
              type="datetime-local"
              icon={<Calendar size={14} />}
              placeholder="Data de devolução (opcional)"
            />

            <LiquidInput
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas"
              icon={<StickyNote size={14} />}
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <LiquidButton variant="default" size="md" onClick={onClose}>Cancelar</LiquidButton>
            <LiquidButton variant="amber" size="md" disabled={!selectedMember} onClick={handleSubmit} icon={<ArrowLeftRight size={14} />}>
              Fazer Check-out
            </LiquidButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HISTORY OVERLAY
───────────────────────────────────────────────────────────── */

function HistoryOverlay({
  item, onClose,
}: {
  item: EquipmentItem;
  onClose: () => void;
}) {
  const sorted = [...item.checkOuts].sort((a, b) => new Date(b.checkedOutAt).getTime() - new Date(a.checkedOutAt).getTime());
  const catColor = CATEGORY_COLOR[item.category] || '#ffffff';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={springConfigs.snappy}
        style={{
          ...glassCard({ intensity: 'heavy', radius: 'xl' }),
          padding: 28,
          width: '100%',
          maxWidth: 460,
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={lensingOverlay()} />
        <div className="relative z-10 flex flex-col" style={{ overflow: 'hidden' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 style={{ color: '#ffffff', fontSize: 17, fontWeight: 800 }}>Histórico</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 }}>{item.name}</p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 9999,
                background: 'rgba(255,255,255,0.08)',
                border: '0.5px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <History size={32} style={{ color: 'rgba(255,255,255,0.2)' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Sem histórico de check-out</span>
            </div>
          ) : (
            <div style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sorted.map(co => {
                const isActive = !co.returnedAt;
                const overdue  = !co.returnedAt && co.dueBack && new Date(co.dueBack) < new Date();
                const accentC  = overdue ? '#ef4444' : isActive ? '#f59e0b' : '#10b981';
                return (
                  <div
                    key={co.id}
                    style={{
                      ...nestedCard(accentC, 'subtle'),
                      padding: '12px 14px',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 13 }}>{co.memberName}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700,
                        background: `rgba(${hexToRgb(accentC)}, 0.15)`,
                        border: `0.5px solid rgba(${hexToRgb(accentC)}, 0.35)`,
                        color: accentC,
                      }}>
                        {overdue ? 'Atrasado' : isActive ? 'Em uso' : 'Devolvido'}
                      </span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 4, display: 'flex', gap: 12 }}>
                      <span>↑ {fmtDate(co.checkedOutAt)}</span>
                      {co.returnedAt && <span>↓ {fmtDate(co.returnedAt)}</span>}
                      {co.dueBack && !co.returnedAt && <span>Due: {fmtDate(co.dueBack)}</span>}
                    </div>
                    {co.notes && (
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 }}>{co.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */

export function EquipmentModule() {
  const {
    equipment, team, apiKey,
    addEquipmentItem, updateEquipmentItem, removeEquipmentItem,
    addEquipmentCheckOut, returnEquipmentItem,
  } = useStore(useShallow((s: any) => ({
    equipment:            s.equipment ?? [],
    team:                 s.team ?? [],
    apiKey:               s.apiKey,
    addEquipmentItem:     s.addEquipmentItem,
    updateEquipmentItem:  s.updateEquipmentItem,
    removeEquipmentItem:  s.removeEquipmentItem,
    addEquipmentCheckOut: s.addEquipmentCheckOut,
    returnEquipmentItem:  s.returnEquipmentItem,
  })));

  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState('all');
  const [addOpen, setAddOpen]               = useState(false);
  const [checkoutOpen, setCheckoutOpen]     = useState<string | null>(null);
  const [historyOpen, setHistoryOpen]       = useState<string | null>(null);

  /* stats */
  const stats = useMemo(() => ({
    total:      (equipment as EquipmentItem[]).length,
    available:  (equipment as EquipmentItem[]).filter(i => i.status === 'available').length,
    checkedOut: (equipment as EquipmentItem[]).filter(i => i.status === 'checked-out').length,
    overdue:    (equipment as EquipmentItem[]).filter(i => isOverdue(i)).length,
  }), [equipment]);

  /* filtered */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (equipment as EquipmentItem[]).filter(item => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (q && !item.name.toLowerCase().includes(q) && !(item.serialNumber || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [equipment, activeCategory, statusFilter, search]);

  const tabs = CATEGORIES.map(c => ({
    id:    c.id,
    label: c.label,
    color: c.id === 'all' ? undefined : c.color,
    count: c.id === 'all'
      ? undefined
      : ((equipment as EquipmentItem[]).filter(i => i.category === c.id).length || undefined),
  }));

  return (
    <LiquidPage
      title="Equipamento"
      description={`${stats.total} ${stats.total === 1 ? 'item' : 'itens'} · ${stats.available} disponíveis`}
      headerAction={
        <LiquidButton variant="emerald" size="md" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
          Adicionar
        </LiquidButton>
      }
    >
      {/* ── Stats ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <LiquidStatCard label="Total"      value={stats.total}      variant="default" icon={<Box size={16} />}             animationDelay={0}   />
        <LiquidStatCard label="Disponível" value={stats.available}  variant="emerald" icon={<CheckCircle2 size={16} />}    animationDelay={100} />
        <LiquidStatCard label="Em Uso"     value={stats.checkedOut} variant="amber"   icon={<ArrowLeftRight size={16} />}   animationDelay={200} />
        <LiquidStatCard label="Atrasado"   value={stats.overdue}    variant="error"   icon={<AlertTriangle size={16} />}   animationDelay={300} pulse={stats.overdue > 0} />
      </div>

      {/* ── Category tabs ──────────────────────────────────────── */}
      <LiquidSection animated animationDelay={200}>
        <LiquidTabs tabs={tabs} active={activeCategory} onChange={id => setActiveCategory(id as Category)} />
      </LiquidSection>

      {/* ── Search + status filters ────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div style={{ flex: 1, minWidth: 200 }}>
          <LiquidInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por nome ou nº de série…"
            icon={<Search size={14} />}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'available', 'checked-out', 'maintenance', 'missing'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: statusFilter === s
                  ? s === 'all' ? 'rgba(255,255,255,0.12)' : `rgba(${hexToRgb(STATUS_COLORS[s])}, 0.18)`
                  : 'rgba(255,255,255,0.04)',
                border: statusFilter === s
                  ? s === 'all' ? '0.5px solid rgba(255,255,255,0.3)' : `0.5px solid rgba(${hexToRgb(STATUS_COLORS[s])}, 0.4)`
                  : '0.5px solid rgba(255,255,255,0.1)',
                color: statusFilter === s
                  ? s === 'all' ? '#ffffff' : STATUS_COLORS[s]
                  : 'rgba(255,255,255,0.5)',
              }}
            >
              {s === 'all' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Equipment list ─────────────────────────────────────── */}
      <LiquidSection animated animationDelay={300}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14">
            <Box size={44} style={{ color: 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
              {equipment.length === 0 ? 'Ainda sem equipamento registado' : 'Nenhum item corresponde à pesquisa'}
            </span>
            {equipment.length === 0 && (
              <LiquidButton variant="emerald" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
                Adicionar primeiro item
              </LiquidButton>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((item: EquipmentItem, i) => (
              <EquipmentRow
                key={item.id}
                item={item}
                index={i}
                onCheckout={() => setCheckoutOpen(item.id)}
                onReturn={() => {
                  const active = getActiveCheckOut(item);
                  if (active) returnEquipmentItem(item.id, active.id, new Date().toISOString());
                }}
                onHistory={() => setHistoryOpen(item.id)}
                onDelete={() => removeEquipmentItem(item.id)}
              />
            ))}
          </div>
        )}
      </LiquidSection>

      {/* ── Modals ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {addOpen && (
          <AddItemOverlay
            onClose={() => setAddOpen(false)}
            onSave={item => { addEquipmentItem(item); setAddOpen(false); }}
            apiKey={apiKey}
          />
        )}
        {checkoutOpen && (() => {
          const it = (equipment as EquipmentItem[]).find(i => i.id === checkoutOpen);
          return it ? (
            <CheckoutOverlay
              item={it}
              team={team}
              onClose={() => setCheckoutOpen(null)}
              onCheckout={co => { addEquipmentCheckOut(checkoutOpen, co); setCheckoutOpen(null); }}
            />
          ) : null;
        })()}
        {historyOpen && (() => {
          const it = (equipment as EquipmentItem[]).find(i => i.id === historyOpen);
          return it ? (
            <HistoryOverlay item={it} onClose={() => setHistoryOpen(null)} />
          ) : null;
        })()}
      </AnimatePresence>
    </LiquidPage>
  );
}

EquipmentModule.displayName = 'EquipmentModule';
