import React, { useState, useRef, useEffect } from 'react';
import { Play, ListPlus, FolderPlus, Download, Trash2, X, CheckSquare, Plus } from 'lucide-react';
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

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
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
        bottom: '84px',
        right: '24px',
        left: 'auto',
        transform: 'none',
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(20, 18, 17, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--v-bdr2)',
        borderRadius: '16px',
        padding: '6px 10px 6px 14px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255,255,255,0.06)',
        animation: 'fadeUpSm 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        userSelect: 'none',
        maxWidth: 'calc(100vw - 48px)',
        boxSizing: 'border-box',
      }}
    >
      {/* Selected badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px' }}>
        <CheckSquare size={15} style={{ color: 'var(--v-accent)' }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--v-fg)', whiteSpace: 'nowrap' }}>
          {count} {count === 1 ? 'track' : 'tracks'}
        </span>
      </div>

      <div style={{ width: '1px', height: '20px', background: 'var(--v-bdr2)', margin: '0 2px' }} />

      {/* Play Selected */}
      <button
        onClick={onPlaySelected}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: 'var(--v-accent)',
          color: '#000',
          border: 'none',
          borderRadius: '10px',
          fontSize: '12.5px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
        title="Play selected tracks"
      >
        <Play size={13} fill="#000" />
        Play
      </button>

      {/* Add to Queue */}
      <button
        onClick={onQueueSelected}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 11px',
          background: 'rgba(255,255,255,0.06)',
          color: 'var(--v-fg)',
          border: '1px solid var(--v-bdr2)',
          borderRadius: '10px',
          fontSize: '12.5px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        title="Add selected to Play Queue"
      >
        <ListPlus size={14} />
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
              padding: '6px 11px',
              background: showPlaylistMenu ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
              color: 'var(--v-fg)',
              border: '1px solid var(--v-bdr2)',
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { if (!showPlaylistMenu) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { if (!showPlaylistMenu) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            title="Add selected to Playlist"
          >
            <FolderPlus size={14} />
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
            padding: '6px 11px',
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--v-fg)',
            border: '1px solid var(--v-bdr2)',
            borderRadius: '10px',
            fontSize: '12.5px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          title="Download selected tracks"
        >
          <Download size={14} />
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
            padding: '6px 11px',
            background: 'rgba(224, 85, 85, 0.12)',
            color: '#f87171',
            border: '1px solid rgba(224, 85, 85, 0.25)',
            borderRadius: '10px',
            fontSize: '12.5px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224, 85, 85, 0.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(224, 85, 85, 0.12)'; }}
          title={isPlaylistView ? 'Remove from playlist' : 'Delete offline files'}
        >
          <Trash2 size={14} />
          {isPlaylistView ? 'Remove' : 'Delete'}
        </button>
      )}

      <div style={{ width: '1px', height: '20px', background: 'var(--v-bdr2)', margin: '0 2px' }} />

      {/* Clear Selection */}
      <button
        onClick={onClearSelection}
        style={{
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          color: 'var(--v-fg3)',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.12s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--v-fg)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--v-fg3)'; e.currentTarget.style.background = 'transparent'; }}
        title="Deselect all (Esc)"
      >
        <X size={15} />
      </button>
    </div>
  );
};
