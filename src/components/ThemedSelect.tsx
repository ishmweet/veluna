import { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { getZoomFactor } from '../utils';

type ThemedSelectProps = {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  minWidth?: string;
  buttonStyle?: React.CSSProperties;
};

export const ThemedSelect = ({ value, options, onChange, icon, minWidth, buttonStyle }: ThemedSelectProps) => {
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

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const zoom = getZoomFactor();
    const dropW = r.width / zoom;
    const left = r.left / zoom;
    const dropH = dropRef.current ? dropRef.current.offsetHeight : (options.length * 36 + 10);
    const spaceBelow = (window.innerHeight - r.bottom) / zoom - 8;
    const spaceAbove = (r.top) / zoom - 8;
    let top = (r.bottom + 4) / zoom;
    if (spaceBelow < dropH && spaceAbove > spaceBelow) {
      top = (r.top - 4) / zoom - dropH;
    }
    setDropPos({ top, left, width: dropW });
  }, [options.length]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const timer = setTimeout(updatePosition, 0);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  const handleOpen = () => {
    updatePosition();
    setOpen(o => !o);
  };

  const dropdown = open ? (
    <div
      ref={dropRef}
      style={{
        position: 'fixed',
        top: dropPos.top,
        left: dropPos.left,
        width: dropPos.width,
        boxSizing: 'border-box',
        zIndex: 999999,
        animation: 'dropIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        background: 'var(--v-bg2)',
        border: '1px solid var(--v-bdr2)',
        borderRadius: '10px',
        padding: '3px',
        boxShadow: '0 20px 48px rgba(0,0,0,0.85), 0 2px 10px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
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
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '6px 8px',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '7px',
              background: isSelected ? 'var(--v-bg3)' : 'transparent',
              border: isSelected ? '1px solid var(--v-bdr2)' : '1px solid transparent',
              outline: 'none',
              transition: 'all 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
              gap: '6px',
              boxSizing: 'border-box',
            }}
            onMouseEnter={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.background = 'var(--v-bg3)';
              }
            }}
            onMouseLeave={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}
          >
            <span style={{
              fontSize: '12.5px',
              fontWeight: isSelected ? 700 : 500,
              color: isSelected ? 'var(--v-accent)' : 'var(--v-fg)',
              letterSpacing: '-0.01em',
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {opt.label}
            </span>
            {isSelected && (
              <Check size={13} style={{ color: 'var(--v-accent)', flexShrink: 0 }} />
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
          padding: '7px 12px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 500,
          border: open ? '1px solid var(--v-bdr2)' : '1px solid var(--v-bdr)',
          outline: 'none',
          background: open ? 'var(--v-bg3)' : 'var(--v-bg2)',
          color: open ? 'var(--v-fg)' : 'var(--v-fg2)',
          cursor: 'pointer',
          minWidth: minWidth || '130px',
          boxSizing: 'border-box',
          transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          ...buttonStyle
        }}
        onMouseEnter={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = 'var(--v-bg3)';
            (e.currentTarget as HTMLElement).style.color = 'var(--v-fg)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--v-bdr2)';
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = 'var(--v-bg2)';
            (e.currentTarget as HTMLElement).style.color = 'var(--v-fg2)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--v-bdr)';
          }
        }}
      >
        {icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>}
        <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{current?.label}</span>
        <ChevronDown size={14} style={{ transition: 'transform .2s cubic-bezier(0.16, 1, 0.3, 1)', transform: open ? 'rotate(180deg)' : 'none', opacity: 0.7, flexShrink: 0 }} />
      </button>
      {typeof document !== 'undefined' && dropdown
        ? ReactDOM.createPortal(dropdown, document.body)
        : null}
    </div>
  );
};
