import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

type ThemedSelectProps = {
  value: string;
  options: { label: string; value: string; desc?: string }[];
  onChange: (v: string) => void;
};

export const ThemedSelect = ({ value, options, onChange }: ThemedSelectProps) => {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const current = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || dropRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      const dropW = Math.max(r.width, 240);
      const left = Math.min(r.left, window.innerWidth - dropW - 8);
      const dropH = dropRef.current ? dropRef.current.offsetHeight : (options.length * 60 + 12);
      const spaceBelow = window.innerHeight - r.bottom - 8;
      const spaceAbove = r.top - 8;
      let top = r.bottom + 6;
      if (spaceBelow < dropH && spaceAbove > spaceBelow) {
        top = r.top - dropH - 6;
      }
      setDropPos({ top, left: Math.max(8, left), width: dropW });
    };
    update();
    const timer = setTimeout(update, 0);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, options.length]);

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const dropW = Math.max(r.width, 240);
      const left = Math.min(r.left, window.innerWidth - dropW - 8);
      const dropH = options.length * 60 + 12;
      const spaceBelow = window.innerHeight - r.bottom - 8;
      const spaceAbove = r.top - 8;
      let top = r.bottom + 6;
      if (spaceBelow < dropH && spaceAbove > spaceBelow) {
        top = r.top - dropH - 6;
      }
      setDropPos({ top, left: Math.max(8, left), width: dropW });
    }
    setOpen(o => !o);
  };

  const dropdown = open ? (
    <div
      ref={dropRef}
      style={{
        position: 'fixed',
        top: dropPos.top,
        left: dropPos.left,
        minWidth: dropPos.width,
        zIndex: 999999,
        animation: 'dropIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        background: '#181615',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '14px',
        padding: '6px',
        boxShadow: '0 20px 48px rgba(0,0,0,0.92), 0 4px 14px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onMouseDown={e => {
              e.preventDefault();
              onChange(opt.value);
              setOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 12px',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '10px',
              background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: isSelected ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid transparent',
              outline: 'none',
              transition: 'all 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
              gap: '12px',
              boxSizing: 'border-box',
            }}
            onMouseEnter={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.04)';
              }
            }}
            onMouseLeave={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <span style={{
                fontSize: '13px',
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? 'var(--v-accent, #e2ddd9)' : '#e2ddd9',
                letterSpacing: '-0.01em',
              }}>
                {opt.label}
              </span>
              {opt.desc && (
                <span style={{
                  fontSize: '11.5px',
                  color: isSelected ? '#a8a29e' : '#78716c',
                  marginTop: '2px',
                  lineHeight: 1.35,
                }}>
                  {opt.desc}
                </span>
              )}
            </div>
            {isSelected && (
              <Check size={14} style={{ color: 'var(--v-accent, #e2ddd9)', flexShrink: 0, marginTop: '2px' }} />
            )}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 14px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 500,
          border: '1px solid rgba(255, 255, 255, 0.09)',
          outline: 'none',
          background: open ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
          color: open ? '#ffffff' : '#c4beba',
          cursor: 'pointer',
          minWidth: '130px',
          transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.06)';
            (e.currentTarget as HTMLElement).style.color = '#ffffff';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.03)';
            (e.currentTarget as HTMLElement).style.color = '#c4beba';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.09)';
          }
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>{current?.label}</span>
        <ChevronDown size={14} style={{ transition: 'transform .2s cubic-bezier(0.16, 1, 0.3, 1)', transform: open ? 'rotate(180deg)' : 'none', opacity: 0.7 }} />
      </button>
      {typeof document !== 'undefined' && dropdown
        ? ReactDOM.createPortal(dropdown, document.body)
        : null}
    </div>
  );
};
