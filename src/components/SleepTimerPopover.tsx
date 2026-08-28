import React, { useState } from 'react';
import { Moon, X, Clock } from 'lucide-react';

export type SleepTimerPopoverProps = {
  sleepTimer: number;
  onSet: (m: number) => void;
  onCancel: () => void;
  onClose: () => void;
};

export const SleepTimerPopover = React.memo(({
  sleepTimer, onSet, onCancel, onClose,
}: SleepTimerPopoverProps) => {
  const [input, setInput] = useState('');
  const presets = [5, 10, 15, 20, 30, 45, 60, 90];

  return (
    <div
      className="v-glass-popover"
      style={{
        width: '260px',
        borderRadius: '16px',
        padding: '14px',
        boxShadow: '0 20px 48px rgba(0,0,0,0.85), 0 0 0 1px var(--v-bdr)',
        animation: 'dropIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--v-bdr)', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--v-fg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Moon size={14} style={{ color: 'var(--v-accent)' }} /> Sleep Timer
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v-fg2)', padding: '2px', display: 'flex', borderRadius: '50%', transition: 'color 0.12s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--v-fg)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--v-fg2)')}
        >
          <X size={14} />
        </button>
      </div>

      {sleepTimer > 0 && (
        <div style={{ padding: '8px 12px', marginBottom: '12px', background: 'var(--v-bg3)', border: '1px solid var(--v-bdr2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--v-fg)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={12} style={{ color: 'var(--v-accent)' }} /> Pausing in <strong>{Math.ceil(sleepTimer / 60)}m</strong>
          </span>
          <button
            onClick={() => { onCancel(); onClose(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px', transition: 'opacity 0.12s' }}
          >
            <X size={11} /> Cancel
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
        {presets.map(m => {
          const isActive = sleepTimer > 0 && Math.ceil(sleepTimer / 60) === m;
          return (
            <button
              key={m}
              onClick={() => { onSet(m); onClose(); }}
              style={{
                padding: '7px 0',
                borderRadius: '8px',
                border: `1px solid ${isActive ? 'var(--v-accent)' : 'var(--v-bdr)'}`,
                background: isActive ? 'var(--v-accent)' : 'var(--v-bg3)',
                color: isActive ? 'var(--v-bg0)' : 'var(--v-fg)',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 700,
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--v-bg4)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--v-bdr2)';
                  (e.currentTarget as HTMLElement).style.color = '#ffffff';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--v-bg3)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--v-bdr)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--v-fg)';
                }
              }}
            >
              {m}m
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="number"
          min="1"
          max="999"
          placeholder="Custom min"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              const m = parseInt(input);
              if (m > 0) { onSet(m); onClose(); }
            }
          }}
          style={{
            flex: 1,
            background: 'var(--v-bg3)',
            border: '1px solid var(--v-bdr2)',
            color: 'var(--v-fg)',
            borderRadius: '8px',
            padding: '7px 12px',
            fontSize: '11.5px',
            outline: 'none',
            transition: 'border-color 0.12s'
          }}
        />
        <button
          onClick={() => {
            const m = parseInt(input);
            if (m > 0) { onSet(m); onClose(); }
          }}
          style={{
            padding: '7px 16px',
            background: 'var(--v-accent)',
            border: 'none',
            color: 'var(--v-bg0)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '11.5px',
            fontWeight: 700,
            transition: 'opacity 0.12s'
          }}
        >
          Set
        </button>
      </div>
    </div>
  );
});

SleepTimerPopover.displayName = 'SleepTimerPopover';
