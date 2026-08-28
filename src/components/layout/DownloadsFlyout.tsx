import React, { useRef, useEffect } from 'react';
import { Download, X, FolderOpen, CheckCircle2, AlertCircle, ArrowUpRight, Trash2 } from 'lucide-react';
import { ActiveDownload } from '../../types';

interface DownloadsFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  downloads: ActiveDownload[];
  onCancelDownload: (url: string) => void;
  onClearCompleted: () => void;
  onOpenFolder: () => void;
  onNavigateToDownloads: () => void;
}

export const DownloadsFlyout: React.FC<DownloadsFlyoutProps> = ({
  isOpen,
  onClose,
  downloads,
  onCancelDownload,
  onClearCompleted,
  onOpenFolder,
  onNavigateToDownloads,
}) => {
  const flyoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeItems = downloads.filter(d => d.status === 'downloading');
  const completedItems = downloads.filter(d => d.status === 'completed');

  return (
    <div
      ref={flyoutRef}
      style={{
        position: 'fixed',
        top: '54px',
        right: '20px',
        width: '350px',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'min(480px, calc(100vh - 110px))',
        background: 'var(--v-bg2)',
        border: '1px solid var(--v-bdr2)',
        borderRadius: '14px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95), 0 2px 10px rgba(0, 0, 0, 0.6)',
        zIndex: 99999,
        animation: 'flyoutIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) both',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--v-bdr)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.015)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--v-fg)', letterSpacing: '-0.01em' }}>
            Downloads
          </span>
          {activeItems.length > 0 && (
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--v-accent)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '1px 7px',
              borderRadius: '20px',
              border: '1px solid var(--v-bdr2)',
            }}>
              {activeItems.length} active
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            onClick={onOpenFolder}
            title="Open Downloads Folder"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--v-fg2)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--v-fg)';
              e.currentTarget.style.background = 'var(--v-bg3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--v-fg2)';
              e.currentTarget.style.background = 'none';
            }}
          >
            <FolderOpen size={14} />
          </button>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--v-fg2)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--v-fg)';
              e.currentTarget.style.background = 'var(--v-bg3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--v-fg2)';
              e.currentTarget.style.background = 'none';
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main Body List Container */}
      <div
        className="v-downloads-scroll"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          maxHeight: '340px',
          overflowY: 'auto',
          padding: downloads.length === 0 ? '36px 20px' : '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {downloads.length === 0 ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'var(--v-bg3)',
              border: '1px solid var(--v-bdr)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}>
              <Download size={18} style={{ color: 'var(--v-fg3)' }} />
            </div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--v-fg)', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
              No active downloads
            </p>
            <p style={{ fontSize: '11.5px', color: 'var(--v-fg3)', margin: 0, lineHeight: 1.4 }}>
              Tracks you download will appear here with live progress
            </p>
          </div>
        ) : (
          downloads.map(item => {
            const isDone = item.status === 'completed' || item.progress >= 100;
            const isError = item.status === 'error';

            return (
              <div
                key={item.url}
                style={{
                  padding: '9px 10px',
                  background: 'var(--v-bg3)',
                  border: '1px solid var(--v-bdr)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '7px',
                  transition: 'all 0.12s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.cover ? (
                    <img
                      src={item.cover}
                      alt={item.title}
                      style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '6px',
                      background: 'var(--v-bg2)',
                      border: '1px solid var(--v-bdr)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Download size={13} style={{ color: 'var(--v-fg2)' }} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--v-fg)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--v-fg2)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: '1px',
                    }}>
                      {item.artist || 'YouTube Music'}
                    </div>
                  </div>

                  {!isDone && (
                    <button
                      onClick={() => onCancelDownload(item.url)}
                      title="Cancel"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--v-fg3)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = 'var(--v-fg3)';
                        e.currentTarget.style.background = 'none';
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Progress Bar & Status */}
                <div>
                  <div style={{
                    width: '100%',
                    height: '3px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${item.progress || (isDone ? 100 : 5)}%`,
                      height: '100%',
                      background: isError ? '#ef4444' : 'var(--v-accent)',
                      borderRadius: '9999px',
                      transition: 'width 0.2s linear',
                    }} />
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '5px',
                    fontSize: '10.5px',
                  }}>
                    <span style={{
                      color: isError ? '#ef4444' : 'var(--v-accent)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      {isDone ? (
                        <>
                          <CheckCircle2 size={11} style={{ color: 'var(--v-accent)' }} />
                          <span>Saved to Offline Library</span>
                        </>
                      ) : isError ? (
                        <>
                          <AlertCircle size={11} />
                          <span>{item.error || 'Failed'}</span>
                        </>
                      ) : (
                        <span>Downloading... {item.progress > 0 ? `${Math.round(item.progress)}%` : ''}</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Clean Footer Bar */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid var(--v-bdr)',
        background: 'rgba(255, 255, 255, 0.01)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {completedItems.length > 0 ? (
          <button
            onClick={onClearCompleted}
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--v-fg2)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 6px',
              borderRadius: '6px',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--v-fg)';
              e.currentTarget.style.background = 'var(--v-bg3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--v-fg2)';
              e.currentTarget.style.background = 'none';
            }}
          >
            <Trash2 size={11} />
            <span>Clear finished</span>
          </button>
        ) : <div />}

        <button
          onClick={() => {
            onClose();
            onNavigateToDownloads();
          }}
          style={{
            fontSize: '11.5px',
            fontWeight: 600,
            color: 'var(--v-fg)',
            background: 'var(--v-bg3)',
            border: '1px solid var(--v-bdr2)',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = 'var(--v-accent)';
            e.currentTarget.style.background = 'var(--v-bg4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--v-fg)';
            e.currentTarget.style.borderColor = 'var(--v-bdr2)';
            e.currentTarget.style.background = 'var(--v-bg3)';
          }}
        >
          <span>Offline Library</span>
          <ArrowUpRight size={12} style={{ color: 'var(--v-accent)' }} />
        </button>
      </div>
    </div>
  );
};
