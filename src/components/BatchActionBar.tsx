import React, { useState, useRef, useEffect } from 'react';
import { Play, ListPlus, FolderPlus, Download, Trash2, X, Plus } from 'lucide-react';
import { Track, Playlist } from '../types';

export interface BatchActionBarProps {
  selectedTracks: Track[];
  playlists: Playlist[];
  onClearSelection: () => void;
  onPlaySelected: () => void;
  onQueueSelected: () => void;
  onAddToPlaylist: (playlistId: string) => void;
  onCreatePlaylistWithSelected?: (name: string) => void;
  onDownloadSelected?: () => void;
  onDeleteSelected?: () => void;
  isOfflineView?: boolean;
  isPlaylistView?: boolean;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = React.memo(({
  selectedTracks,
  playlists,
  onClearSelection,
  onPlaySelected,
  onQueueSelected,
  onAddToPlaylist,
  onCreatePlaylistWithSelected,
  onDownloadSelected,
  onDeleteSelected,
  isOfflineView = false,
  isPlaylistView = false,
}) => {
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCreatingNew) {
          setIsCreatingNew(false);
        } else if (showPlaylistMenu) {
          setShowPlaylistMenu(false);
        } else if (selectedTracks.length > 0) {
          onClearSelection();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTracks.length, isCreatingNew, showPlaylistMenu, onClearSelection]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPlaylistMenu(false);
        setIsCreatingNew(false);
      }
    };
    if (showPlaylistMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPlaylistMenu]);

  if (selectedTracks.length === 0) return null;

  const count = selectedTracks.length;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '92px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(18, 16, 15, 0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '9999px',
        padding: '5px 8px 5px 14px',
        boxShadow: '0 20px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.06)',
        animation: 'fadeUpSm 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        userSelect: 'none',
        maxWidth: 'calc(100vw - 48px)',
        boxSizing: 'border-box',
      }}
    >
      {/* Selected badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginRight: '4px' }}>
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '4px',
          background: 'var(--v-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--v-fg)', whiteSpace: 'nowrap' }}>
          {count} {count === 1 ? 'track' : 'tracks'}
        </span>
      </div>

      <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 2px' }} />

      {/* Play Selected */}
      <button
        onClick={onPlaySelected}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 13px',
          background: 'var(--v-accent)',
          color: '#000',
          border: 'none',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
        onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
        title="Play selected tracks"
      >
        <Play size={12} fill="#000" />
        Play
      </button>

      {/* Add to Queue */}
      <button
        onClick={onQueueSelected}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 11px',
          background: 'rgba(255,255,255,0.06)',
          color: 'var(--v-fg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        title="Add selected to Play Queue"
      >
        <ListPlus size={13} />
        Queue
      </button>

      {/* Add to Playlist Dropdown */}
      {!isOfflineView && !selectedTracks.some(t => t.url.startsWith('local://')) && (
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setShowPlaylistMenu(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 11px',
              background: showPlaylistMenu ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
              color: 'var(--v-fg)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { if (!showPlaylistMenu) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { if (!showPlaylistMenu) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            title="Add selected to Playlist"
          >
            <FolderPlus size={13} />
            Playlist
          </button>

          {showPlaylistMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: '8px',
              minWidth: '210px',
              background: 'var(--v-bg2)',
              border: '1px solid var(--v-bdr2)',
              borderRadius: '12px',
              padding: '6px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.8)',
              zIndex: 1000,
              maxHeight: '260px',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--v-fg3)', padding: '6px 8px 4px' }}>
              Add {count} to Playlist
            </div>

            {playlists.length === 0 && !isCreatingNew && (
              <div style={{ fontSize: '11.5px', color: 'var(--v-fg3)', padding: '6px 10px' }}>
                No playlists yet
              </div>
            )}

            {playlists.map(pl => (
              <button
                key={pl.id}
                onClick={() => {
                  onAddToPlaylist(pl.id);
                  setShowPlaylistMenu(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--v-fg)',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pl.name}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--v-fg3)' }}>{pl.tracks.length}</span>
              </button>
            ))}

            {isCreatingNew ? (
              <div style={{ padding: '6px 8px', display: 'flex', gap: '6px', marginTop: '4px', borderTop: '1px solid var(--v-bdr2)' }}>
                <input
                  type="text"
                  placeholder="Playlist name..."
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newPlaylistName.trim()) {
                      onCreatePlaylistWithSelected?.(newPlaylistName.trim());
                      setNewPlaylistName('');
                      setIsCreatingNew(false);
                      setShowPlaylistMenu(false);
                    }
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'var(--v-bg3)',
                    border: '1px solid var(--v-bdr3)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    color: 'var(--v-fg)',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => {
                    if (newPlaylistName.trim()) {
                      onCreatePlaylistWithSelected?.(newPlaylistName.trim());
                      setNewPlaylistName('');
                      setIsCreatingNew(false);
                      setShowPlaylistMenu(false);
                    }
                  }}
                  style={{
                    background: 'var(--v-accent)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Create
                </button>
              </div>
            ) : (
              onCreatePlaylistWithSelected && (
                <button
                  onClick={() => setIsCreatingNew(true)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 10px',
                    marginTop: '4px',
                    borderTop: '1px solid var(--v-bdr2)',
                    background: 'transparent',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    color: 'var(--v-accent)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderRadius: '0 0 8px 8px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Plus size={13} />
                  New Playlist...
                </button>
              )
            )}
          </div>
        )}
      </div>
      )}

      {/* Download All (Online tracks) */}
      {!isOfflineView && onDownloadSelected && (
        <button
          onClick={onDownloadSelected}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 11px',
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--v-fg)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          title="Download selected tracks"
        >
          <Download size={13} />
          Download
        </button>
      )}

      {/* Delete / Remove (Playlist or Offline view) */}
      {(isOfflineView || isPlaylistView) && onDeleteSelected && (
        <button
          onClick={onDeleteSelected}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 11px',
            background: 'rgba(224, 85, 85, 0.12)',
            color: '#f87171',
            border: '1px solid rgba(224, 85, 85, 0.25)',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224, 85, 85, 0.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(224, 85, 85, 0.12)'; }}
          title={isPlaylistView ? 'Remove from playlist' : 'Delete offline files'}
        >
          <Trash2 size={13} />
          {isPlaylistView ? 'Remove' : 'Delete'}
        </button>
      )}

      <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 2px' }} />

      {/* Clear Selection */}
      <button
        onClick={onClearSelection}
        style={{
          width: '26px',
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          color: 'var(--v-fg3)',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--v-fg3)'; e.currentTarget.style.background = 'transparent'; }}
        title="Deselect all (Esc)"
      >
        <X size={14} />
      </button>
    </div>
  );
});
