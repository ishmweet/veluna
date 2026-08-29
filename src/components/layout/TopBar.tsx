import React, { useState } from 'react';
import { ChevronLeft, Download } from 'lucide-react';
import { Track, ActiveDownload } from '../../types';

interface TopBarProps {
  activeNav: string;
  setActiveNav?: (nav: any) => void;
  navigateTo?: (nav: any) => void;
  openPlaylistId: string | null;
  setOpenPlaylistId: (id: string | null) => void;
  hasSearched: boolean;
  tracks: Track[];
  ytMusicTracks: Track[];
  videoTracks: Track[];
  isSearching: boolean;
  navHistory: any[];
  navigateBack?: () => void;
  resetSearch: () => void;
  activeDownloads?: ActiveDownload[];
  isDownloadsFlyoutOpen?: boolean;
  setIsDownloadsFlyoutOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  downloadPulseKey?: number;
  onOpenShortcuts?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeNav,
  setActiveNav: _setActiveNav,
  navigateTo: customNavigateTo,
  openPlaylistId,
  setOpenPlaylistId,
  hasSearched,
  tracks,
  ytMusicTracks,
  videoTracks,
  isSearching,
  navHistory,
  navigateBack: customNavigateBack,
  resetSearch,
  activeDownloads = [],
  isDownloadsFlyoutOpen = false,
  setIsDownloadsFlyoutOpen,
  downloadPulseKey = 0,
  onOpenShortcuts,
}) => {
  const _navigateTo = _setActiveNav || customNavigateTo || (() => {});
  const navigateBack = customNavigateBack || (() => {
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      _navigateTo(prev);
    }
  });
  const [logoHovered, setLogoHovered] = useState(false);

  const isSearchActive = activeNav === 'home' && (hasSearched || tracks.length > 0 || ytMusicTracks.length > 0 || videoTracks.length > 0 || isSearching);
  const isPlaylistOpen = (activeNav === 'playlists' || activeNav === 'library') && Boolean(openPlaylistId);
  const isBackEnabled = isSearchActive || isPlaylistOpen || navHistory.length > 0;

  const handleBackClick = () => {
    if (isSearchActive) {
      resetSearch();
    } else if (isPlaylistOpen) {
      setOpenPlaylistId(null);
    } else {
      navigateBack();
    }
  };

  return (
    <>
      {/* Ambient Lighting Backdrop */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        right: '-100px',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(226,221,217,0.035) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="v-topbar" style={{background:"var(--v-bg0)",padding:"14px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <button
            className="v-topbar__back"
            onClick={handleBackClick}
            disabled={!isBackEnabled}
          >
            <ChevronLeft size={14} />
            <span>Back</span>
          </button>
          <span className="v-topbar__crumb">
            {activeNav === 'home' ? 'Home' : activeNav === 'downloads' ? 'Offline' : activeNav === 'settings' ? 'Settings' : activeNav === 'stats' ? 'Stats' : (activeNav === 'playlists' || activeNav === 'library') ? (openPlaylistId ? 'Playlist' : 'Playlists') : activeNav}
          </span>
        </div>

        {/* Active Downloads Icon Button */}
        {(() => {
          const activeCount = activeDownloads.filter(d => d.status === 'downloading').length;
          return (
            <button
              key={downloadPulseKey}
              data-downloads-trigger="true"
              onClick={() => setIsDownloadsFlyoutOpen?.(prev => !prev)}
              className={downloadPulseKey ? 'animate-dl-pulse' : ''}
              style={{
                position: "fixed",
                top: "14px",
                right: "64px",
                zIndex: 100,
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                background: isDownloadsFlyoutOpen || activeCount > 0 ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)",
                border: isDownloadsFlyoutOpen || activeCount > 0 ? "1px solid var(--v-accent)" : "1px solid rgba(255, 255, 255, 0.08)",
                color: isDownloadsFlyoutOpen || activeCount > 0 ? "var(--v-accent)" : "#c4beba",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                padding: 0,
              }}
              onMouseEnter={e => {
                if (!isDownloadsFlyoutOpen && activeCount === 0) {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }
              }}
              onMouseLeave={e => {
                if (!isDownloadsFlyoutOpen && activeCount === 0) {
                  e.currentTarget.style.color = '#c4beba';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }
              }}
              title="Active Downloads"
            >
              <Download size={16} />
              {activeCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  minWidth: "15px",
                  height: "15px",
                  borderRadius: "8px",
                  background: "var(--v-accent, #ff7a00)",
                  color: "#0e0d0d",
                  fontSize: "9.5px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 3px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
                }}>
                  {activeCount}
                </span>
              )}
            </button>
          );
        })()}

        {/* Veluna Logo at the Far Top Right of the Window */}
        <div style={{
          position: "fixed",
          top: "14px",
          right: "20px",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          transition: "transform 0.2s ease",
          transform: logoHovered ? "scale(1.06)" : "none"
        }}
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
          onClick={() => onOpenShortcuts ? onOpenShortcuts() : _navigateTo('home')}
          title="Keyboard Shortcuts (?)"
        >
          <svg width="34" height="34" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
            <rect width="28" height="28" rx="7" fill="var(--v-accent)"/>
            <polygon points="4,6 8.5,6 14,21 19.5,6 24,6 14,23" fill="#0e0d0d"/>
            <polygon points="8.5,6 11.5,6 14,16 16.5,6 19.5,6 14,21" fill="var(--v-accent)"/>
          </svg>
        </div>
      </div>
    </>
  );
};
