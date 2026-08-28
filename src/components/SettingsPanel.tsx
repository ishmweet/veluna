import React, { useState, useEffect } from 'react';
import {
  Search, X, ArrowUpCircle, ExternalLink, RefreshCw,
  FolderDown, FolderOpen, Image, Zap, BarChart2, Globe,
  Moon, Database, Upload, ArchiveRestore, Trash2,
  Download, GitBranch, Radio, CheckCircle2,
  AlertCircle, HardDrive
} from 'lucide-react';
import { SettingsTab, DiskInfo, CacheInfo } from '../types';
import { loadLS, saveLS, lightenColor, validateSettingsChange, formatBytes } from '../utils';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { ThemedSelect } from './ThemedSelect';
import { validateListenBrainzToken, validateLastFmSession, DEFAULT_LASTFM_API_KEY, DEFAULT_LASTFM_API_SECRET } from '../services/scrobbler';

const SettingsSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onChange}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        width: "42px",
        height: "24px",
        borderRadius: "12px",
        flexShrink: 0,
        background: checked ? "var(--v-accent)" : "#232020",
        border: "1px solid",
        borderColor: checked ? "var(--v-accent)" : hovered ? "#3a3735" : "var(--v-bdr3)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        outline: "none",
        boxShadow: checked ? "0 0 8px var(--v-accent)" : "none"
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: checked ? "21px" : "3px",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: checked ? "#000000" : "#5c5755",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4)"
        }}
      />
    </button>
  );
};

export type SettingsPanelProps = {
  initialTab?: SettingsTab;
  downloadQuality: string; setDownloadQuality: (q: string) => void;
  downloadPath: string; handleSelectDirectory: () => void;
  downloadFormat: string; setDownloadFormat: (f: string) => void;
  embedThumbnail: boolean; setEmbedThumbnail: (v: boolean) => void;
  duplicateDetect: boolean; setDuplicateDetect: (v: boolean) => void;
  onBackup: () => void; onRestore: () => void; onReset: () => void;
  backupPath: string; setBackupPath: (p: string) => void;
  loudnormEnabled: boolean; setLoudnormEnabled: (e: boolean) => void;
  skipSilence: boolean; setSkipSilence: (v: boolean) => void;
  autoplayEnabled: boolean; setAutoplayEnabled: (v: boolean) => void;
  eq: { bass: number; mid: number; treble: number }; setEq: (v: { bass: number; mid: number; treble: number }) => void;
  showToast: (m: string) => void;
  updateAvailable: string | null;
  appVersion: string;
  onNavigateToUpdates?: () => void;
  lyricsSource: string; setLyricsSource: (v: string) => void;
  trayEnabled: boolean; setTrayEnabled: (v: boolean) => void;
  discordRpcEnabled: boolean; setDiscordRpcEnabled: (v: boolean) => void;
  listenbrainzEnabled?: boolean; setListenbrainzEnabled?: (v: boolean) => void;
  listenbrainzToken?: string; setListenbrainzToken?: (t: string) => void;
  listenbrainzUsername?: string; setListenbrainzUsername?: (u: string) => void;
  lastfmEnabled?: boolean; setLastfmEnabled?: (v: boolean) => void;
  lastfmSessionKey?: string; setLastfmSessionKey?: (k: string) => void;
  lastfmApiKey?: string; setLastfmApiKey?: (k: string) => void;
  lastfmApiSecret?: string; setLastfmApiSecret?: (s: string) => void;
  lastfmUsername?: string; setLastfmUsername?: (u: string) => void;
  theme: string; setThemeState: (t: string) => void;
  accentColor: string; setAccentColorState: (a: string) => void;
  customBgColor: string; setCustomBgColorState: (c: string) => void;
  autoCheckUpdates: boolean; setAutoCheckUpdates: (v: boolean) => void;
  isCheckingUpdate: boolean; handleCheckUpdate: () => void;
  performanceMode: boolean; setPerformanceMode: (v: boolean) => void;
  startupNav?: string; setStartupNav?: (v: string) => void;
  cacheEnabled?: boolean; setCacheEnabled?: (v: boolean) => void;
};

export function SettingsPanel({
  initialTab,
  downloadQuality, setDownloadQuality, downloadPath, handleSelectDirectory,
  downloadFormat, setDownloadFormat,
  embedThumbnail, setEmbedThumbnail,
  duplicateDetect, setDuplicateDetect,
  onBackup, onRestore, onReset,
  backupPath, setBackupPath,
  loudnormEnabled, setLoudnormEnabled,
  skipSilence, setSkipSilence,
  autoplayEnabled, setAutoplayEnabled,
  eq, setEq,
  showToast,
  updateAvailable,
  appVersion,
  lyricsSource, setLyricsSource,
  trayEnabled, setTrayEnabled,
  discordRpcEnabled, setDiscordRpcEnabled,
  listenbrainzEnabled = false, setListenbrainzEnabled = () => {},
  listenbrainzToken = '', setListenbrainzToken = () => {},
  listenbrainzUsername = '', setListenbrainzUsername = () => {},
  lastfmEnabled = false, setLastfmEnabled = () => {},
  lastfmSessionKey = '', setLastfmSessionKey = () => {},
  lastfmApiKey = DEFAULT_LASTFM_API_KEY, setLastfmApiKey = () => {},
  lastfmApiSecret = DEFAULT_LASTFM_API_SECRET, setLastfmApiSecret = () => {},
  lastfmUsername = '', setLastfmUsername = () => {},
  theme, setThemeState,
  accentColor, setAccentColorState,
  customBgColor, setCustomBgColorState,
  autoCheckUpdates, setAutoCheckUpdates,
  isCheckingUpdate, handleCheckUpdate,
  performanceMode, setPerformanceMode,
  startupNav: propStartupNav, setStartupNav: propSetStartupNav,
  cacheEnabled: propCacheEnabled, setCacheEnabled: propSetCacheEnabled,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'playback');
  const [lbTesting, setLbTesting] = useState(false);
  const [lbStatus, setLbStatus] = useState<{ ok?: boolean; msg?: string } | null>(null);
  const [lfmTesting, setLfmTesting] = useState(false);
  const [lfmStatus, setLfmStatus] = useState<{ ok?: boolean; msg?: string } | null>(null);
  const [showAdvancedLfm, setShowAdvancedLfm] = useState(false);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [searchQuery, setSearchQuery] = useState('');

  const matchCard = (keywords: (string | undefined | null | number)[]) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const tokens = q.split(/\s+/).filter(Boolean);
    const validKeywords = keywords
      .filter((k): k is string | number => k !== undefined && k !== null)
      .map(k => String(k).toLowerCase());
    return tokens.every(token => validKeywords.some(kw => kw.includes(token)));
  };

  const showTab = (tab: SettingsTab) => {
    if (searchQuery.trim()) return true;
    return activeTab === tab;
  };

  const [diskInfo, setDiskInfo] = useState<DiskInfo | null>(null);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [cacheLimit, setCacheLimit] = useState<string>(() => loadLS('vg_cacheLimit', '1gb'));
  const [internalCacheEnabled, setInternalCacheEnabled] = useState(() => loadLS('vg_cacheEnabled', true));
  const cacheEnabled = propCacheEnabled !== undefined ? propCacheEnabled : internalCacheEnabled;
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [internalStartupNav, setInternalStartupNav] = useState(() => loadLS('vg_startupNav', 'home'));
  const startupNav = propStartupNav || internalStartupNav;
  const [hoveredSlider, setHoveredSlider] = useState<string | null>(null);

  const refreshCacheInfo = () => {
    invoke<CacheInfo>('get_cache_info').then(setCacheInfo).catch(() => {});
  };

  const handleToggleCache = async (enabled: boolean) => {
    setInternalCacheEnabled(enabled);
    propSetCacheEnabled?.(enabled);
    saveLS('vg_cacheEnabled', enabled);
    try {
      await invoke('set_cache_enabled', { enabled });
      if (!enabled) {
        const freed = await invoke<number>('clear_app_cache');
        showToast(`Caching disabled — ${formatBytes(freed)} cache purged`);
      } else {
        showToast('Caching & stream prefetching enabled');
      }
      refreshCacheInfo();
    } catch (e) {
      showToast(`Cache update failed: ${e}`);
    }
  };

  const handleStartupNavChange = (v: string) => {
    setInternalStartupNav(v);
    propSetStartupNav?.(v);
    saveLS('vg_startupNav', v);
    const label = v === 'home' ? 'Home' : v === 'downloads' ? 'Offline' : v === 'stats' ? 'Stats' : (v === 'library' || v === 'playlists') ? 'Playlists' : v === 'last' ? 'Last Opened' : 'Settings';
    showToast(`Default startup view set to ${label}`);
  };

  const handleCacheLimitChange = async (limit: string) => {
    setCacheLimit(limit);
    saveLS('vg_cacheLimit', limit);
    const label = limit === '500mb' ? '500 MB' : limit === '1gb' ? '1 GB' : limit === '2gb' ? '2 GB' : limit === '5gb' ? '5 GB' : 'Unlimited';
    showToast(`Cache limit set to ${label}`);

    const limitMap: Record<string, number> = {
      '500mb': 500 * 1024 * 1024,
      '1gb': 1024 * 1024 * 1024,
      '2gb': 2 * 1024 * 1024 * 1024,
      '5gb': 5 * 1024 * 1024 * 1024,
      'unlimited': 0,
    };
    const maxBytes = limitMap[limit] ?? 1024 * 1024 * 1024;
    try {
      const pruned = await invoke<number>('prune_cache_if_needed', { maxBytes });
      if (pruned > 0) {
        showToast(`Auto-cleaned ${formatBytes(pruned)} of cache`);
      }
      refreshCacheInfo();
    } catch {}
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      const freed = await invoke<number>('clear_app_cache');
      showToast(`Cache cleared (${formatBytes(freed)} freed)`);
      refreshCacheInfo();
    } catch (e) {
      showToast(`Failed to clear cache: ${e}`);
    } finally {
      setIsClearingCache(false);
    }
  };

  useEffect(() => {
    invoke<DiskInfo>('get_disk_usage', { path: downloadPath }).then(setDiskInfo).catch(() => {});
    refreshCacheInfo();
  }, [downloadPath, activeTab]);

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'playback',     label: 'Playback',     icon: <Zap size={15} /> },
    { id: 'downloads',    label: 'Downloads',    icon: <FolderDown size={15} /> },
    { id: 'integrations', label: 'Integrations', icon: <Globe size={15} /> },
    { id: 'appearance',   label: 'Appearance',   icon: <Moon size={15} /> },
    { id: 'storage',      label: 'Storage',      icon: <Database size={15} /> },
    { id: 'updates',      label: 'Updates',      icon: <ArrowUpCircle size={15} /> },
  ];

  const matchesUpdates = showTab('updates') && (
    matchCard(["Updates", "Check for new releases of Veluna", "Update available", "You're up to date", "Latest version", "GitHub", "Changelog", appVersion, updateAvailable || ""]) ||
    matchCard(["Updates", "Check Automatically on Startup", "Manual Update Check", "Check Now", "Startup check", "Force update", "Releases"])
  );

  const matchesDownloads = showTab('downloads') && (
    matchCard(["Downloads", "Audio Specifications", "Download Quality", "Audio Quality", "Bitrate", "High", "Medium", "Low", "320kbps", "128kbps", "Sound quality", downloadQuality]) ||
    matchCard(["Downloads", "Audio Specifications", "Audio Format", "Format", "Codec", "MP3", "Opus", "M4A", "FLAC", "Lossless", "AAC", downloadFormat]) ||
    matchCard(["Downloads", "Download Directory", "Download Folder", "Download Path", "Storage Location", "Save Location", "Folder", "Browse", "Offline tracks", downloadPath]) ||
    matchCard(["Downloads", "File Options", "Embed Artwork Thumbnail", "Thumbnail", "Album Cover", "Cover Art", "ID3 Tags", "Artwork"]) ||
    matchCard(["Downloads", "File Options", "Smart Duplicate Detection", "Duplicate Detection", "Skip existing", "Duplicates", "Overwrite"])
  );

  const matchesPlayback = showTab('playback') && (
    matchCard(["Playback", "Audio Processing", "Loudness Normalization", "Loudnorm", "EBU R128", "Volume Normalization", "Sound leveling", "Gain"]) ||
    matchCard(["Playback", "Audio Processing", "Skip Silence", "Silence Removal", "Remove silent gaps", "Silence"]) ||
    matchCard(["Playback", "Audio Processing", "Autoplay Recommendations", "Autoplay", "Continuous playback", "Queue similar", "Infinite music"]) ||
    matchCard(["Playback", "Equalizer", "EQ", "Bass", "Mid", "Treble", "Flat", "Bass Boost", "Vocal", "Rock", "Electronic", "Presets", "dB", "60Hz", "1kHz", "16kHz", "Frequencies", "Sound tuning"])
  );

  const matchesIntegrations = showTab('integrations') && (
    matchCard(["Integrations", "Discord Integration", "Discord Rich Presence", "Discord RPC", "Discord", "Playing status", "Activity", "Now playing"]) ||
    matchCard(["Integrations", "Lyrics Provider", "Primary Source", "Lyrics", "lrclib", "Musixmatch", "NetEase", "Synced lyrics", "Richsync", "Subtitles", "Karaoke", lyricsSource])
  );

  const matchesAppearance = showTab('appearance') && (
    matchCard(["Appearance", "Application Theme", "Theme", "Dark mode", "Obsidian", "Midnight Navy", "Forest Emerald", "Cyberpunk", "Sunset Crimson", "Pure Black", "Custom Theme", "Hex", "Color picker", theme, customBgColor]) ||
    matchCard(["Appearance", "Accent Color", "Accent", "Silver", "Indigo", "Emerald", "Magenta", "Orange", "Crimson", "Custom Hex", "Highlight color", accentColor]) ||
    matchCard(["Appearance", "System Integration", "System Tray", "Enable System Tray Icon", "Minimize to tray", "Close to tray", "Background", "Tray"]) ||
    matchCard(["Appearance", "Startup Behavior", "Default Startup View", "Startup View", "Home", "Downloads", "Offline", "Library", "Playlists", "Stats", "Settings", "Launch", startupNav]) ||
    matchCard(["Appearance", "Performance & Graphics", "Low-Spec / Performance Mode", "Low-Spec Mode", "Performance Mode", "Eco Mode", "Performance", "Graphics", "GPU", "Battery", "Lag", "Speed", "Animations", "Blur", "Low power"])
  );

  const matchesStorage = showTab('storage') && (
    matchCard(["Storage", "Cache Storage & Auto-Cleaner", "Cache", "Cache Size Limit", "Auto-Cleaner", "Clear Cache", "Disk Usage", "Temp Storage", cacheLimit, cacheInfo?.formatted_size || ""]) ||
    matchCard(["Storage", "Backup Location", "Download Directory", "veluna_backup.json", backupPath, downloadPath, "Save path", "Folder"]) ||
    matchCard(["Storage", "Backup & Restore Actions", "Create Backup", "Restore Backup", "JSON", "Export data", "Import data", "Save playlists", "Restore playlists", "Settings backup"]) ||
    matchCard(["Storage", "Reset Veluna App", "Reset", "Clear data", "Factory reset", "Wipe database", "Delete all", "Danger zone", "Irreversible"])
  );

  const hasAnyMatches = !searchQuery.trim() || matchesUpdates || matchesDownloads || matchesPlayback || matchesIntegrations || matchesAppearance || matchesStorage;

  return (
    <div style={{flex:1,display:"flex",overflow:"hidden",background:"var(--v-bg0)"}}>
      <div style={{width:"180px",flexShrink:0,background:"var(--v-bg0)",borderRight:"none",display:"flex",flexDirection:"column",padding:"16px 10px",gap:"4px"}}>
        <div style={{fontSize:"11px",fontWeight:800,letterSpacing:".18em",textTransform:"uppercase",color:"#76706c",padding:"4px 10px 14px"}}>Settings</div>
        
        <div style={{ padding: "0 2px 12px" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={12} style={{ position: "absolute", left: "11px", color: "#5c5755", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Find a setting..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 28px 8px 30px",
                background: "rgba(226, 221, 217, 0.03)",
                border: "1px solid var(--v-bdr2)",
                borderRadius: "9999px",
                color: "#e2ddd9",
                fontSize: "13px",
                outline: "none",
                transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)",
                boxSizing: "border-box"
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = "#44403c";
                e.currentTarget.style.background = "rgba(226, 221, 217, 0.05)";
                e.currentTarget.style.boxShadow = "0 0 0 1px #44403c";
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = "var(--v-bdr2)";
                e.currentTarget.style.background = "rgba(226, 221, 217, 0.03)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "none",
                  border: "none",
                  color: "#5c5755",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: 0
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#e2ddd9")}
                onMouseLeave={e => (e.currentTarget.style.color = "#5c5755")}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {tabs.map(tab => {
          const isActive = activeTab === tab.id && !searchQuery;
          return (
            <button key={tab.id} onClick={() => { setSearchQuery(''); setActiveTab(tab.id); }}
              style={{
                display:"flex",alignItems:"center",gap:"12px",
                padding:"10px 14px",borderRadius:"9999px",
                border:"none",cursor:"pointer",
                textAlign:"left",width:"100%",
                fontSize:"14.5px",fontWeight:isActive?700:500,
                background:isActive?"rgba(226,221,217,0.06)":"transparent",
                color:isActive?"#e2ddd9":"#8c8682",
                position:"relative",
                transition:"all 0.15s ease-out",
              }}
              onMouseEnter={e=>{if(!isActive){e.currentTarget.style.background="rgba(226, 221, 217, 0.025)";e.currentTarget.style.color="#e2ddd9";}}}
              onMouseLeave={e=>{if(!isActive){e.currentTarget.style.background="transparent";e.currentTarget.style.color="#8c8682";}}}>
              {isActive && (
                <span style={{position:"absolute",left:"3px",top:"10px",bottom:"10px",width:"3px",borderRadius:"1.5px",background:"var(--v-accent)"}} />
              )}
              <span style={{color:isActive?"#e2ddd9":"#5c5755",display:"flex",flexShrink:0,transition:"color 0.15s ease"}}>{tab.icon}</span>
              <span style={{flex:1}}>{tab.label}</span>
              {tab.id === 'updates' && updateAvailable && (
                <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#a1a1aa",flexShrink:0}} />
              )}
            </button>
          );
        })}

        {searchQuery && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "13.5px",
            fontWeight: 500,
            background: "rgba(226, 221, 217, 0.04)",
            color: "#e2ddd9",
            position: "relative"
          }}>
            <span style={{
              position: "absolute",
              left: "0",
              top: "10px",
              bottom: "10px",
              width: "3px",
              borderRadius: "1.5px",
              background: "#9e9894"
            }} />
            <span style={{ color: "#9e9894", display: "flex", flexShrink: 0 }}><Search size={12} /></span>
            <span>Search Results</span>
          </div>
        )}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 24px 140px 24px"}} className="custom-scrollbar">
        {searchQuery && (
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#e2ddd9", margin: "0 0 3px" }}>Search Results</h2>
            <p style={{ fontSize: "13px", color: "#5c5755", marginTop: "3px" }}>Showing settings matching "{searchQuery}"</p>
          </div>
        )}

        {!hasAnyMatches ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", color: "#5c5755", gap: "10px" }}>
            <Search size={28} strokeWidth={1.5} />
            <p style={{ fontSize: "14px" }}>No settings match your search</p>
          </div>
        ) : (
          <>
        {matchesUpdates && (
          <div style={{display:"flex",flexDirection:"column",gap:"24px"}}>
            <div>
              <h2 style={{fontSize:"24px",fontWeight:800,letterSpacing:"-0.01em",color:"#e2ddd9",margin:"0 0 4px"}}>Updates</h2>
              <p style={{fontSize:"13.5px",color:"#6f6966",margin:0}}>Check for new releases and view version status.</p>
            </div>

            {/* Clean Status Area (Not in a box) */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              padding: "4px 0 8px 0",
            }}>
              {/* Clean App Icon */}
              <div style={{
                width: "52px",
                height: "52px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                flexShrink: 0,
                position: "relative"
              }}>
                <svg width="30" height="30" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
                  <rect width="28" height="28" rx="6" fill="var(--v-accent)"/>
                  <polygon points="4,6 8.5,6 14,21 19.5,6 24,6 14,23" fill="#0e0d0d"/>
                  <polygon points="8.5,6 11.5,6 14,16 16.5,6 19.5,6 14,21" fill="var(--v-accent)"/>
                </svg>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {updateAvailable ? (
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                      Update available: v{updateAvailable}
                    </div>
                    <p style={{ fontSize: "12.5px", color: "#8c8682", margin: "4px 0 12px 0", lineHeight: 1.4 }}>
                      A new version of Veluna is ready to download. Features and stability updates await.
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button
                        onClick={() => openUrl('https://github.com/rry0ku/veluna/releases/latest')}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "7px 16px",
                          borderRadius: "18px",
                          background: "var(--v-accent)",
                          color: "var(--v-bg0)",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
                      >
                        <Download size={13} strokeWidth={2.4} /> Download v{updateAvailable}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                      You're up to date
                    </div>
                    <p style={{ fontSize: "12.5px", color: "#8c8682", margin: "4px 0 8px 0" }}>
                      Veluna v{appVersion} is currently the latest version.
                    </p>
                    <a
                      href="#"
                      onClick={e => { e.preventDefault(); openUrl('https://github.com/rry0ku/veluna'); }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--v-accent)",
                        textDecoration: "none"
                      }}
                      onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
                    >
                      <ExternalLink size={12} /> Visit GitHub Repository
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Version Metadata Strip */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
            }}>
              <div style={{
                borderRadius: "10px",
                border: "1px solid var(--v-bdr)",
                background: "var(--v-bg0)",
                padding: "13px 15px",
                display: "flex",
                flexDirection: "column",
                gap: "4px"
              }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#6f6966", textTransform: "uppercase", letterSpacing: "0.04em" }}>Installed Version</span>
                <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#e2ddd9", fontFamily: "monospace" }}>v{appVersion}</span>
              </div>

              <div style={{
                borderRadius: "10px",
                border: "1px solid var(--v-bdr)",
                background: "var(--v-bg0)",
                padding: "13px 15px",
                display: "flex",
                flexDirection: "column",
                gap: "4px"
              }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#6f6966", textTransform: "uppercase", letterSpacing: "0.04em" }}>Latest Available</span>
                <span style={{ fontSize: "13.5px", fontWeight: 700, color: updateAvailable ? "var(--v-accent)" : "#10b981", fontFamily: "monospace" }}>
                  v{updateAvailable || appVersion}
                </span>
              </div>

              <div style={{
                borderRadius: "10px",
                border: "1px solid var(--v-bdr)",
                background: "var(--v-bg0)",
                padding: "13px 15px",
                display: "flex",
                flexDirection: "column",
                gap: "4px"
              }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#6f6966", textTransform: "uppercase", letterSpacing: "0.04em" }}>Update Source</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#e2ddd9", display: "flex", alignItems: "center", gap: "6px" }}>
                  <GitBranch size={13} style={{ color: "var(--v-accent)" }} /> GitHub Releases
                </span>
              </div>
            </div>

            {/* Standard Settings Card */}
            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid #141312"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Check Automatically on Startup</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>Automatically check for new releases when launching Veluna</p>
                </div>
                <SettingsSwitch checked={autoCheckUpdates} onChange={() => setAutoCheckUpdates(!autoCheckUpdates)} />
              </div>
              
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Manual Update Check</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>Force a search for the latest version of Veluna on GitHub</p>
                </div>
                <button
                  onClick={handleCheckUpdate}
                  disabled={isCheckingUpdate}
                  style={{
                    padding: "7px 16px",
                    borderRadius: "18px",
                    background: isCheckingUpdate ? "rgba(255,255,255,0.02)" : "var(--v-accent)",
                    color: isCheckingUpdate ? "#5c5755" : "var(--v-bg0)",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: isCheckingUpdate ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                    boxShadow: isCheckingUpdate ? "none" : "0 2px 8px rgba(0,0,0,0.15)"
                  }}
                  onMouseEnter={e => {
                    if (!isCheckingUpdate) {
                      e.currentTarget.style.filter = "brightness(1.1)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isCheckingUpdate) {
                      e.currentTarget.style.filter = "none";
                    }
                  }}
                >
                  {isCheckingUpdate ? (
                    <>
                      <div style={{width:"12px",height:"12px",border:"2px solid #5c5755",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={13} />
                      Check Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {matchesDownloads && (
          <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
            <div>
              <h2 style={{fontSize:"24px",fontWeight:800,letterSpacing:"-0.01em",color:"#e2ddd9",margin:"0 0 4px"}}>Downloads</h2>
              <p style={{fontSize:"13.5px",color:"#6f6966",margin:0}}>Configure download quality, formats, and folders.</p>
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",margin:0}}>Audio Specifications</h3>
              </div>
              
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid var(--v-bdr)"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Download Quality</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>
                    {downloadQuality === 'High' ? 'Best available audio bitrate (320kbps+)' : downloadQuality === 'Medium' ? 'Balanced quality (~128kbps)' : 'Smallest file size'}
                  </p>
                </div>
                <ThemedSelect
                  value={downloadQuality}
                  onChange={setDownloadQuality}
                  options={[
                    { value: 'High', label: 'High' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'Low', label: 'Low' },
                  ]}
                />
              </div>

              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Audio Format</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>
                    {downloadFormat === 'opus' ? 'Best compression, native YouTube codec' : downloadFormat === 'm4a' ? 'AAC in M4A, great Apple/car stereo compat' : downloadFormat === 'flac' ? 'Lossless — largest files' : 'MP3 — widest compatibility'}
                  </p>
                </div>
                <ThemedSelect
                  value={downloadFormat}
                  onChange={setDownloadFormat}
                  options={[
                    { value: 'mp3',  label: 'MP3' },
                    { value: 'opus', label: 'Opus' },
                    { value: 'm4a',  label: 'M4A' },
                    { value: 'flac', label: 'FLAC' },
                  ]}
                />
              </div>
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",margin:0}}>Download Directory</h3>
              </div>
              <div className="v-settings-row" style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"background 0.15s ease-out"}} onMouseEnter={e=>(e.currentTarget.style.background="rgba(226,221,217,0.005)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")} onClick={handleSelectDirectory}>
                <div style={{flex:1,minWidth:0}}>
                  <div className="v-settings-path-capsule" style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12.5px",
                    color: "#9e9894",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--v-bdr)",
                    borderRadius: "20px",
                    padding: "4px 10px",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    fontFamily: "monospace",
                    maxWidth: "90%"
                  }}>
                    <FolderOpen size={13} style={{ color: "var(--v-accent)", flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{downloadPath}</span>
                  </div>
                  {diskInfo && <p style={{fontSize:"12px",color:"#5c5755",marginTop:"6px"}}>{formatBytes(diskInfo.used_bytes)} used · {diskInfo.track_count} offline tracks</p>}
                </div>
                <button style={{padding:"6px",marginLeft:"12px",color:"#5c5755",background:"none",border:"none",cursor:"pointer",flexShrink:0,borderRadius:"7px",display:"flex",transition:"color .12s"}} onMouseEnter={e=>(e.currentTarget.style.color="#e2ddd9")} onMouseLeave={e=>(e.currentTarget.style.color="#5c5755")}>
                  <FolderOpen size={16} />
                </button>
              </div>
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",display:"flex",alignItems:"center",gap:"8px",margin:0}}><Image size={14} style={{color:"#8c8682"}} /> File Options</h3>
              </div>
              
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid #141312"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Embed Artwork Thumbnail</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>{embedThumbnail ? 'Active — album/track cover art is embedded into audio file tags' : 'Disabled — downloaded audio files will have no embedded cover'}</p>
                </div>
                <SettingsSwitch checked={embedThumbnail} onChange={() => setEmbedThumbnail(!embedThumbnail)} />
              </div>
              
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Smart Duplicate Detection</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>{duplicateDetect ? 'Active — tracks already in your download folder are skipped' : 'Disabled — duplicates will download and overwrite if triggered'}</p>
                </div>
                <SettingsSwitch checked={duplicateDetect} onChange={() => setDuplicateDetect(!duplicateDetect)} />
              </div>
            </div>
          </div>
        )}

        {matchesPlayback && (
          <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
            <div>
              <h2 style={{fontSize:"24px",fontWeight:800,letterSpacing:"-0.01em",color:"#e2ddd9",margin:"0 0 4px"}}>Playback</h2>
              <p style={{fontSize:"13.5px",color:"#6f6966",margin:0}}>Configure the audio engine and playback behaviors.</p>
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",margin:0,display:"flex",alignItems:"center",gap:"8px"}}><Zap size={14} style={{color:"#8c8682"}} /> Audio Processing</h3>
              </div>
              
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #141312"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Loudness Normalization</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>{loudnormEnabled ? 'Active — consistent volume across tracks (EBU R128)' : 'Disabled — raw volume, faster track start'}</p>
                </div>
                <SettingsSwitch checked={loudnormEnabled} onChange={() => {
                  const next = !loudnormEnabled;
                  const warn = validateSettingsChange('loudnormEnabled', next, { loudnormEnabled, skipSilence, eq });
                  if (warn) { showToast(warn); }
                  setLoudnormEnabled(next);
                }} />
              </div>

              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #141312"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Skip Silence</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>{skipSilence ? 'Active — auto-skips silent gaps' : 'Disabled — plays entire track including silence'}</p>
                </div>
                <SettingsSwitch checked={skipSilence} onChange={() => {
                  const next = !skipSilence;
                  const warn = validateSettingsChange('skipSilence', next, { loudnormEnabled, skipSilence, eq });
                  if (warn) { showToast(warn); }
                  setSkipSilence(next);
                }} />
              </div>

              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Autoplay Recommendations</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>{autoplayEnabled ? 'Active — queues similar recommendations when music ends' : 'Disabled — playback stops when queue finishes'}</p>
                </div>
                <SettingsSwitch checked={autoplayEnabled} onChange={() => setAutoplayEnabled(!autoplayEnabled)} />
              </div>
            </div>

            <div style={{borderRadius:"14px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              {/* Header & Presets */}
              <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:"12px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <h3 style={{fontSize:"14.5px",fontWeight:700,color:"var(--v-fg)",margin:0,display:"flex",alignItems:"center",gap:"8px",letterSpacing:"-0.01em"}}>
                    <BarChart2 size={15} style={{color:"var(--v-fg2)"}} /> Equalizer
                  </h3>
                  <button onClick={() => { setEq({ bass: 0, mid: 0, treble: 0 }); invoke('set_equalizer', { bass: 0, mid: 0, treble: 0 }).catch(() => {}); }}
                    style={{fontSize:"12px",fontWeight:700,color:"var(--v-fg2)",cursor:"pointer",padding:"4px 14px",borderRadius:"9999px",border:"1px solid var(--v-bdr2)",background:"rgba(255,255,255,0.02)",transition:"all .15s ease"}}
                    onMouseEnter={e=>{e.currentTarget.style.color="var(--v-fg)";e.currentTarget.style.borderColor="var(--v-bdr3)";e.currentTarget.style.background="rgba(255,255,255,0.06)";}}
                    onMouseLeave={e=>{e.currentTarget.style.color="var(--v-fg2)";e.currentTarget.style.borderColor="var(--v-bdr2)";e.currentTarget.style.background="rgba(255,255,255,0.02)";}}>
                    Reset
                  </button>
                </div>

                {/* Preset Chips */}
                <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
                  {[
                    { name: 'Flat', preset: { bass: 0, mid: 0, treble: 0 } },
                    { name: 'Bass Boost', preset: { bass: 7, mid: -1, treble: 2 } },
                    { name: 'Vocal', preset: { bass: -2, mid: 6, treble: 3 } },
                    { name: 'Treble', preset: { bass: -1, mid: 2, treble: 7 } },
                    { name: 'Electronic', preset: { bass: 6, mid: 1, treble: 5 } },
                    { name: 'Rock', preset: { bass: 5, mid: -2, treble: 5 } }
                  ].map(({ name, preset }) => {
                    const isSelected = eq.bass === preset.bass && eq.mid === preset.mid && eq.treble === preset.treble;
                    return (
                      <button key={name} onClick={() => {
                        setEq(preset);
                        invoke('set_equalizer', preset).catch(() => {});
                      }}
                      style={{
                        padding:"5px 14px",borderRadius:"9999px",fontSize:"12.5px",fontWeight:600,cursor:"pointer",
                        border: isSelected ? "1px solid var(--v-accent)" : "1px solid var(--v-bdr2)",
                        background: isSelected ? "var(--v-accent)" : "rgba(255,255,255,0.02)",
                        color: isSelected ? "var(--v-bg0)" : "var(--v-fg2)",
                        transition: "all .15s ease",
                      }}
                      onMouseEnter={e=>{if(!isSelected){e.currentTarget.style.color="var(--v-fg)";e.currentTarget.style.borderColor="var(--v-bdr3)";e.currentTarget.style.background="rgba(255,255,255,0.05)";}}}
                      onMouseLeave={e=>{if(!isSelected){e.currentTarget.style.color="var(--v-fg2)";e.currentTarget.style.borderColor="var(--v-bdr2)";e.currentTarget.style.background="rgba(255,255,255,0.02)";}}}>
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Band Sliders */}
              <div style={{padding:"8px 18px 18px",display:"flex",flexDirection:"column",gap:"10px"}}>
                {([
                  { label: 'Bass', key: 'bass' as const, freq: '60–250 Hz' },
                  { label: 'Mid', key: 'mid' as const, freq: '500 Hz–2 kHz' },
                  { label: 'Treble', key: 'treble' as const, freq: '4–16 kHz' },
                ] as { label: string; key: 'bass' | 'mid' | 'treble'; freq: string }[]).map(({ label, key, freq }) => {
                  const val = eq[key];
                  const isActive = val !== 0;
                  return (
                    <div key={key} style={{
                      borderRadius:"10px",
                      background: "var(--v-bg2)",
                      border: "1px solid var(--v-bdr)",
                      padding:"11px 14px",
                      transition:"all .15s ease",
                    }}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                          <span style={{fontSize:"14px",fontWeight:700,color:isActive?"var(--v-fg)":"var(--v-fg2)",transition:"color .15s"}}>{label}</span>
                          <span style={{fontSize:"11px",fontWeight:500,color:"var(--v-fg3)",letterSpacing:"0.02em"}}>{freq}</span>
                        </div>
                        <div style={{
                          fontSize:"12.5px",fontWeight:700,
                          fontVariantNumeric:"tabular-nums",
                          color: isActive ? "var(--v-fg)" : "var(--v-fg3)",
                          background: isActive ? "rgba(255,255,255,0.04)" : "transparent",
                          padding:"2px 8px",borderRadius:"9999px",
                          transition:"all .15s ease",
                          minWidth:"48px",textAlign:"center",
                        }}>
                          {val > 0 ? `+${val}` : val} dB
                        </div>
                      </div>

                      <div style={{position:"relative",height:"5px",background:"rgba(255,255,255,0.06)",borderRadius:"9999px"}}
                        onMouseEnter={() => setHoveredSlider(key)}
                        onMouseLeave={() => setHoveredSlider(null)}>
                        {/* Center Zero Tick */}
                        <div style={{position:"absolute",left:"50%",top:"-3px",width:"1px",height:"11px",background:"var(--v-bdr2)",borderRadius:"1px",pointerEvents:"none"}}/>

                        {/* Active Track Fill */}
                        <div style={{
                          position:"absolute",top:0,height:"100%",borderRadius:"9999px",pointerEvents:"none",
                          background:'var(--v-accent)',
                          left: val >= 0 ? '50%' : `${((val + 12) / 24) * 100}%`,
                          width: `${(Math.abs(val) / 24) * 100}%`,
                        }}/>

                        {/* Thumb Knob */}
                        <div style={{
                          position:"absolute",
                          top:"50%",
                          transform: hoveredSlider === key ? "translateY(-50%) scale(1.2)" : "translateY(-50%) scale(1)",
                          width:"13px",height:"13px",
                          borderRadius:"50%",
                          border:`2px solid ${isActive?'var(--v-accent)':'var(--v-fg3)'}`,
                          background:"var(--v-bg0)",
                          pointerEvents:"none",
                          transition:"left 0.08s ease-out, transform 0.15s ease",
                          left: `calc(${((val + 12) / 24) * 100}% - 6.5px)`
                        }}/>

                        <input type="range" min="-12" max="12" step="1" value={val}
                          onChange={e => {
                            const v = parseInt(e.target.value);
                            const next = { ...eq, [key]: v };
                            setEq(next);
                            invoke('set_equalizer', { bass: next.bass, mid: next.mid, treble: next.treble }).catch(() => {});
                          }}
                          style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0,cursor:"pointer",margin:0}}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {matchesIntegrations && (
          <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
            <div>
              <h2 style={{fontSize:"24px",fontWeight:800,letterSpacing:"-0.01em",color:"#e2ddd9",margin:"0 0 4px"}}>Integrations</h2>
              <p style={{fontSize:"13.5px",color:"#6f6966",margin:0}}>Configure external integrations and social status activity.</p>
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",margin:0}}>Discord Integration</h3>
              </div>
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Discord Rich Presence</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>{discordRpcEnabled ? 'Active — shows listening activity on your Discord profile' : 'Disabled — listening activity is hidden'}</p>
                </div>
                <SettingsSwitch checked={discordRpcEnabled} onChange={() => setDiscordRpcEnabled(!discordRpcEnabled)} />
              </div>
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",margin:0}}>Lyrics Provider</h3>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Primary Source</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>
                    {lyricsSource === 'musixmatch' ? 'Musixmatch — word-level richsync when available'
                      : lyricsSource === 'netease' ? 'NetEase — great for Asian artists & translations'
                      : 'lrclib — open, fast, fully synced and community-driven'}
                  </p>
                </div>
                <ThemedSelect value={lyricsSource} onChange={setLyricsSource} options={[
                  { value: 'lrclib', label: 'lrclib' },
                  { value: 'musixmatch', label: 'Musixmatch' },
                  { value: 'netease', label: 'NetEase' },
                ]} />
              </div>
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <Radio size={15} style={{color:"#d51007"}} />
                  <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",margin:0}}>Last.fm Scrobbling</h3>
                </div>
                <button
                  onClick={() => openUrl('https://www.last.fm/api/account/create')}
                  style={{fontSize:"11.5px",color:"#8a817c",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px",padding:0}}
                  onMouseEnter={e => e.currentTarget.style.color = '#e2ddd9'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8a817c'}
                >
                  <span>Last.fm API Portal</span>
                  <ExternalLink size={12} />
                </button>
              </div>
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Enable Last.fm Scrobbling</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>
                    {lastfmEnabled ? 'Logs Now Playing updates and scrobbles to your Last.fm profile' : 'Disabled — scrobbles are not sent'}
                  </p>
                </div>
                <SettingsSwitch checked={lastfmEnabled} onChange={() => setLastfmEnabled(!lastfmEnabled)} />
              </div>

              {lastfmEnabled && (
                <div style={{padding:"0 16px 16px 16px",display:"flex",flexDirection:"column",gap:"12px",borderTop:"1px solid rgba(255,255,255,0.03)",paddingTop:"14px"}}>
                  <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <label style={{fontSize:"11.5px",fontWeight:600,color:"#8a817c",letterSpacing:".04em",textTransform:"uppercase"}}>
                        Session Key (sk)
                      </label>
                      {lastfmUsername && (
                        <span style={{fontSize:"11.5px",fontWeight:600,color:"#10b981",display:"flex",alignItems:"center",gap:"4px"}}>
                          <CheckCircle2 size={12} />
                          Connected as @{lastfmUsername}
                        </span>
                      )}
                    </div>
                    <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                      <input
                        type="password"
                        value={lastfmSessionKey}
                        onChange={e => {
                          setLastfmSessionKey(e.target.value);
                          setLfmStatus(null);
                        }}
                        placeholder="Enter your Last.fm Session Key"
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: "var(--v-bg2)",
                          border: "1px solid var(--v-bdr2)",
                          color: "#e2ddd9",
                          fontSize: "12.5px",
                          outline: "none"
                        }}
                      />
                      <button
                        disabled={lfmTesting || !lastfmSessionKey.trim()}
                        onClick={async () => {
                          setLfmTesting(true);
                          setLfmStatus(null);
                          const res = await validateLastFmSession(lastfmSessionKey, lastfmApiKey, lastfmApiSecret);
                          setLfmTesting(false);
                          if (res.valid && res.username) {
                            setLastfmUsername(res.username);
                            setLfmStatus({ ok: true, msg: `Verified as @${res.username}` });
                            showToast(`Last.fm connected: @${res.username}`);
                          } else {
                            setLfmStatus({ ok: false, msg: res.error || 'Invalid session' });
                            showToast(`Last.fm error: ${res.error || 'Invalid session'}`);
                          }
                        }}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: "1px solid var(--v-bdr2)",
                          background: "var(--v-bg2)",
                          color: lastfmSessionKey.trim() ? "#e2ddd9" : "#5c5755",
                          fontWeight: 600,
                          fontSize: "12px",
                          cursor: lastfmSessionKey.trim() ? "pointer" : "not-allowed",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          whiteSpace: "nowrap"
                        }}
                      >
                        <RefreshCw size={12} className={lfmTesting ? "animate-spin" : ""} />
                        <span>{lfmTesting ? 'Checking...' : 'Test Connection'}</span>
                      </button>
                    </div>
                  </div>

                  {lfmStatus && (
                    <div style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: lfmStatus.ok ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                      border: `1px solid ${lfmStatus.ok ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                      color: lfmStatus.ok ? "#10b981" : "#ef4444"
                    }}>
                      {lfmStatus.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                      <span>{lfmStatus.msg}</span>
                    </div>
                  )}

                  {/* Advanced Custom API Keys toggle */}
                  <div style={{marginTop:"4px"}}>
                    <button
                      onClick={() => setShowAdvancedLfm(!showAdvancedLfm)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "11.5px",
                        color: "#8a817c",
                        cursor: "pointer",
                        padding: 0,
                        textDecoration: "underline"
                      }}
                    >
                      {showAdvancedLfm ? 'Hide Custom API Key Settings' : 'Custom Last.fm API Key / Secret (Optional)'}
                    </button>

                    {showAdvancedLfm && (
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginTop:"10px"}}>
                        <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
                          <label style={{fontSize:"11px",color:"#6f6966"}}>API Key</label>
                          <input
                            type="text"
                            value={lastfmApiKey}
                            onChange={e => setLastfmApiKey(e.target.value)}
                            placeholder={DEFAULT_LASTFM_API_KEY}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              background: "var(--v-bg2)",
                              border: "1px solid var(--v-bdr2)",
                              color: "#e2ddd9",
                              fontSize: "11.5px",
                              outline: "none"
                            }}
                          />
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
                          <label style={{fontSize:"11px",color:"#6f6966"}}>API Secret</label>
                          <input
                            type="password"
                            value={lastfmApiSecret}
                            onChange={e => setLastfmApiSecret(e.target.value)}
                            placeholder={DEFAULT_LASTFM_API_SECRET}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              background: "var(--v-bg2)",
                              border: "1px solid var(--v-bdr2)",
                              color: "#e2ddd9",
                              fontSize: "11.5px",
                              outline: "none"
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <Radio size={15} style={{color:"#eb743b"}} />
                  <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",margin:0}}>ListenBrainz Scrobbling</h3>
                </div>
                <button
                  onClick={() => openUrl('https://listenbrainz.org/profile/')}
                  style={{fontSize:"11.5px",color:"#8a817c",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px",padding:0}}
                  onMouseEnter={e => e.currentTarget.style.color = '#e2ddd9'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8a817c'}
                >
                  <span>Get User Token</span>
                  <ExternalLink size={12} />
                </button>
              </div>
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Enable ListenBrainz Scrobbling</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>
                    {listenbrainzEnabled ? 'Submits Now Playing status and scrobbles after 50% track duration' : 'Disabled — listens are not submitted'}
                  </p>
                </div>
                <SettingsSwitch checked={listenbrainzEnabled} onChange={() => setListenbrainzEnabled(!listenbrainzEnabled)} />
              </div>

              {listenbrainzEnabled && (
                <div style={{padding:"0 16px 16px 16px",display:"flex",flexDirection:"column",gap:"12px",borderTop:"1px solid rgba(255,255,255,0.03)",paddingTop:"14px"}}>
                  <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <label style={{fontSize:"11.5px",fontWeight:600,color:"#8a817c",letterSpacing:".04em",textTransform:"uppercase"}}>
                        User Token
                      </label>
                      {listenbrainzUsername && (
                        <span style={{fontSize:"11.5px",fontWeight:600,color:"#10b981",display:"flex",alignItems:"center",gap:"4px"}}>
                          <CheckCircle2 size={12} />
                          Connected as @{listenbrainzUsername}
                        </span>
                      )}
                    </div>
                    <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                      <input
                        type="password"
                        value={listenbrainzToken}
                        onChange={e => {
                          setListenbrainzToken(e.target.value);
                          setLbStatus(null);
                        }}
                        placeholder="Paste your ListenBrainz User Token"
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: "var(--v-bg2)",
                          border: "1px solid var(--v-bdr2)",
                          color: "#e2ddd9",
                          fontSize: "12.5px",
                          outline: "none"
                        }}
                      />
                      <button
                        disabled={lbTesting || !listenbrainzToken.trim()}
                        onClick={async () => {
                          setLbTesting(true);
                          setLbStatus(null);
                          const res = await validateListenBrainzToken(listenbrainzToken);
                          setLbTesting(false);
                          if (res.valid && res.username) {
                            setListenbrainzUsername(res.username);
                            setLbStatus({ ok: true, msg: `Verified as @${res.username}` });
                            showToast(`ListenBrainz connected: @${res.username}`);
                          } else {
                            setLbStatus({ ok: false, msg: res.error || 'Invalid token' });
                            showToast(`ListenBrainz error: ${res.error || 'Invalid token'}`);
                          }
                        }}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: "1px solid var(--v-bdr2)",
                          background: "var(--v-bg2)",
                          color: listenbrainzToken.trim() ? "#e2ddd9" : "#5c5755",
                          fontWeight: 600,
                          fontSize: "12px",
                          cursor: listenbrainzToken.trim() ? "pointer" : "not-allowed",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          whiteSpace: "nowrap"
                        }}
                      >
                        <RefreshCw size={12} className={lbTesting ? "animate-spin" : ""} />
                        <span>{lbTesting ? 'Checking...' : 'Test Connection'}</span>
                      </button>
                    </div>
                  </div>

                  {lbStatus && (
                    <div style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: lbStatus.ok ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                      border: `1px solid ${lbStatus.ok ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                      color: lbStatus.ok ? "#10b981" : "#ef4444"
                    }}>
                      {lbStatus.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                      <span>{lbStatus.msg}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {matchesAppearance && (
          <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
            <div>
              <h2 style={{fontSize:"24px",fontWeight:800,letterSpacing:"-0.01em",color:"#e2ddd9",margin:"0 0 4px"}}>Appearance</h2>
              <p style={{fontSize:"13.5px",color:"#6f6966",margin:0}}>Customize application themes, accent colors, and startup behaviors.</p>
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",margin:0}}>Application Theme</h3>
              </div>
              <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"12px"}}>
                <p style={{fontSize:"13px",color:"#6f6966",margin:0}}>Choose from one of our curated high-contrast dark modes.</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"12px",marginTop:"4px"}}>
                  {[
                    { id: 'obsidian', name: 'Obsidian', desc: 'True deep black', bg: '#0c0b0b', cardBg: '#171515', accent: '#e2ddd9' },
                    { id: 'midnight', name: 'Midnight Navy', desc: 'Deep navy tones', bg: '#05070e', cardBg: '#0d1222', accent: '#4f46e5' },
                    { id: 'forest', name: 'Forest Emerald', desc: 'Moss & dark greens', bg: '#040806', cardBg: '#0b1510', accent: '#10b981' },
                    { id: 'cyberpunk', name: 'Cyberpunk', desc: 'Vibrant neon purple', bg: '#0a0112', cardBg: '#1b032d', accent: '#d946ef' },
                    { id: 'sunset', name: 'Sunset Crimson', desc: 'Burnt red tones', bg: '#0a0505', cardBg: '#1b0c0c', accent: '#ef4444' },
                    { id: 'pureblack', name: 'Pure Black', desc: 'Solid high contrast', bg: '#000000', cardBg: '#080808', accent: '#ffffff' },
                  ].map(t => {
                    const isSelected = theme === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setThemeState(t.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: isSelected ? "rgba(226,221,217,0.03)" : "rgba(226,221,217,0.005)",
                          border: isSelected ? "1px solid var(--v-accent)" : "1px solid rgba(255,255,255,0.04)",
                          borderRadius: "10px",
                          padding: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          textAlign: "left",
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                            e.currentTarget.style.background = "rgba(226, 221, 217, 0.015)";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)";
                            e.currentTarget.style.background = "rgba(226,221,217,0.005)";
                          }
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                          <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
                            <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: t.bg, border: "1px solid rgba(255,255,255,0.08)" }} />
                            <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: t.cardBg, border: "1px solid rgba(255,255,255,0.08)" }} />
                            <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: t.accent, border: "1px solid rgba(255,255,255,0.08)" }} />
                          </div>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "#e2ddd9" }}>{t.name}</span>
                          <span style={{ fontSize: "11.5px", color: "#5c5755", marginTop: "2px" }}>{t.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  onClick={() => setThemeState('custom')}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: theme === 'custom' ? "rgba(226,221,217,0.03)" : "rgba(226,221,217,0.005)",
                    border: theme === 'custom' ? "1px solid var(--v-accent)" : "1px solid rgba(255,255,255,0.04)",
                    borderRadius: "10px",
                    padding: "16px 20px",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    textAlign: "left",
                    marginTop: "12px"
                  }}
                  onMouseEnter={e => {
                    if (theme !== 'custom') {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.background = "rgba(226, 221, 217, 0.015)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (theme !== 'custom') {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.background = "rgba(226,221,217,0.005)";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: customBgColor, border: "1px solid rgba(255,255,255,0.08)" }} />
                      <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: lightenColor(customBgColor, 4), border: "1px solid rgba(255,255,255,0.08)" }} />
                      <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: accentColor, border: "1px solid rgba(255,255,255,0.08)" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: "#e2ddd9" }}>Custom Theme</span>
                      <span style={{ fontSize: "12px", color: "#5c5755", marginTop: "2px" }}>Personal background color</span>
                    </div>
                  </div>
                  
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "6px 12px",
                      background: "rgba(255, 255, 255, 0.015)",
                      border: "1px solid rgba(255, 255, 255, 0.04)",
                      borderRadius: "8px",
                      opacity: theme === 'custom' ? 1 : 0.6,
                      transition: "opacity 0.2s"
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#6f6966", fontWeight: 500 }}>Hex:</span>
                    <input
                      type="text"
                      value={customBgColor}
                      disabled={theme !== 'custom'}
                      onChange={e => {
                          const val = e.target.value;
                          if (val.startsWith('#') && val.length <= 7) {
                            setCustomBgColorState(val);
                          }
                      }}
                      placeholder="#0c0b0b"
                      style={{
                        width: "78px",
                        padding: "4px 8px",
                        fontSize: "12px",
                        background: "rgba(0, 0, 0, 0.2)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        borderRadius: "6px",
                        color: "#e2ddd9",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                    <div
                      style={{
                        position: "relative",
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.15)",
                        cursor: theme === 'custom' ? "pointer" : "default",
                        background: "linear-gradient(45deg, #ff0055, #00ffcc, #9900ff)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)"
                      }}
                      title={theme === 'custom' ? "Choose Color" : "Select Custom Theme First"}
                      onMouseEnter={e => { if (theme === 'custom') e.currentTarget.style.transform = "scale(1.12)"; }}
                      onMouseLeave={e => { if (theme === 'custom') e.currentTarget.style.transform = "scale(1)"; }}
                    >
                      <input
                        type="color"
                        value={customBgColor}
                        disabled={theme !== 'custom'}
                        onChange={e => setCustomBgColorState(e.target.value)}
                        style={{
                          position: "absolute",
                          top: "-4px",
                          left: "-4px",
                          width: "30px",
                          height: "30px",
                          opacity: 0,
                          cursor: theme === 'custom' ? "pointer" : "default",
                        }}
                      />
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.6)", pointerEvents: "none" }}>+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",margin:0}}>Accent Color</h3>
              </div>
              <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"12px"}}>
                <p style={{fontSize:"13px",color:"#6f6966",margin:0}}>Choose a preset highlight color or select a custom color profile.</p>
                <div style={{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap",marginTop:"4px"}}>
                  {[
                    { value: '#e2ddd9', label: 'Silver' },
                    { value: '#5f5bf6', label: 'Indigo' },
                    { value: '#10b981', label: 'Emerald' },
                    { value: '#d946ef', label: 'Magenta' },
                    { value: '#f97316', label: 'Orange' },
                    { value: '#ef4444', label: 'Crimson' },
                  ].map(acc => {
                    const isSelected = accentColor.toLowerCase() === acc.value.toLowerCase();
                    return (
                      <button
                        key={acc.value}
                        onClick={() => setAccentColorState(acc.value)}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: acc.value,
                          border: isSelected ? "2px solid #ffffff" : "1px solid rgba(255,255,255,0.15)",
                          cursor: "pointer",
                          position: "relative",
                          outline: isSelected ? "2px solid var(--v-accent)" : "none",
                          outlineOffset: "2px",
                          transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                          boxSizing: "border-box"
                        }}
                        title={acc.label}
                        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.12)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                      />
                    );
                  })}

                  <div
                    style={{
                      position: "relative",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      border: "1px solid rgba(255,255,255,0.15)",
                      cursor: "pointer",
                      background: "linear-gradient(45deg, #ff0055, #00ffcc, #9900ff)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}
                    title="Custom Hex Picker"
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.12)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                  >
                    <input
                      type="color"
                      value={accentColor.startsWith('#') && accentColor.length === 7 ? accentColor : '#e2ddd9'}
                      onChange={e => setAccentColorState(e.target.value)}
                      style={{
                        position: "absolute",
                        top: "-4px",
                        left: "-4px",
                        width: "36px",
                        height: "36px",
                        opacity: 0,
                        cursor: "pointer",
                      }}
                    />
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.6)", pointerEvents: "none" }}>+</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#5c5755", fontWeight: 500 }}>Hex:</span>
                    <input
                      type="text"
                      value={accentColor}
                      onChange={e => setAccentColorState(e.target.value)}
                      placeholder="#ffffff"
                      style={{
                        width: "82px",
                        padding: "6px 8px",
                        fontSize: "12px",
                        background: "rgba(226,221,217,0.015)",
                        border: "1px solid var(--v-bdr)",
                        borderRadius: "8px",
                        color: "#e2ddd9",
                        outline: "none",
                        fontFamily: "monospace",
                        textAlign: "center"
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#44403c";
                        e.currentTarget.style.background = "rgba(226, 221, 217, 0.03)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = "#1a1817";
                        e.currentTarget.style.background = "rgba(226, 221, 217, 0.015)";
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",margin:0}}>System Integration</h3>
              </div>
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Enable System Tray Icon</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>{trayEnabled ? 'Active — window minimizes to system tray on close' : 'Disabled — close exits the app entirely'}</p>
                </div>
                <SettingsSwitch checked={trayEnabled} onChange={async () => {
                  const next = !trayEnabled;
                  try { await invoke('tray_set', { enabled: next }); setTrayEnabled(next); }
                  catch (e) { showToast(`Tray unavailable: ${e}`); }
                }} />
              </div>
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",margin:0}}>Startup Behavior</h3>
              </div>
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Default Startup View</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>Currently opens on {startupNav === 'home' ? 'Home' : startupNav === 'downloads' ? 'Offline' : startupNav === 'stats' ? 'Stats' : (startupNav === 'library' || startupNav === 'playlists') ? 'Playlists' : startupNav === 'last' ? 'Last Opened View' : 'Settings'}</p>
                </div>
                <ThemedSelect
                  value={startupNav === 'library' ? 'playlists' : startupNav}
                  onChange={handleStartupNavChange}
                  options={[
                    { value: 'home', label: 'Home' },
                    { value: 'downloads', label: 'Offline' },
                    { value: 'playlists', label: 'Playlists' },
                    { value: 'stats', label: 'Stats' },
                    { value: 'settings', label: 'Settings' },
                    { value: 'last', label: 'Last Opened' },
                  ]}
                />
              </div>
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)",display:"flex",alignItems:"center",gap:"8px"}}>
                <Zap size={14} style={{color:"var(--v-accent)"}}/>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",margin:0}}>Performance & Graphics</h3>
              </div>
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px"}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9",margin:0}}>Low-Spec / Performance Mode</p>
                  <p style={{fontSize:"12px",color:"#6f6966",margin:"4px 0 0 0",lineHeight:1.4}}>
                    {performanceMode
                      ? 'Active — GPU blur effects, heavy hover transitions, and continuous animations are disabled for maximum smoothness on older hardware.'
                      : 'Disabled — full visual effects, fluid transitions, and standard animations are enabled.'}
                  </p>
                </div>
                <SettingsSwitch checked={performanceMode} onChange={() => {
                  const next = !performanceMode;
                  setPerformanceMode(next);
                  showToast(next ? 'Low-Spec Mode enabled' : 'Low-Spec Mode disabled');
                }} />
              </div>
            </div>
          </div>
        )}

        {matchesStorage && (
          <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
            <div>
              <h2 style={{fontSize:"24px",fontWeight:800,letterSpacing:"-0.01em",color:"#e2ddd9",margin:"0 0 4px"}}>Storage</h2>
              <p style={{fontSize:"13.5px",color:"#6f6966",margin:0}}>Backup, restore data, and manage application maintenance.</p>
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <HardDrive size={15} style={{color:"var(--v-accent)"}} />
                  <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",margin:0}}>Cache Storage & Auto-Cleaner</h3>
                </div>
                {cacheEnabled && (
                  <button
                    disabled={isClearingCache || (cacheInfo?.total_bytes === 0)}
                    onClick={handleClearCache}
                    style={{
                      fontSize:"11.5px",
                      color: isClearingCache || (cacheInfo?.total_bytes === 0) ? "#5c5755" : "#e2ddd9",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--v-bdr2)",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      cursor: isClearingCache || (cacheInfo?.total_bytes === 0) ? "not-allowed" : "pointer",
                      display:"flex",
                      alignItems:"center",
                      gap:"5px",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={e => { if (!isClearingCache && cacheInfo?.total_bytes !== 0) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--v-bdr2)'; }}
                  >
                    <RefreshCw size={11} className={isClearingCache ? "animate-spin" : ""} />
                    <span>{isClearingCache ? 'Clearing...' : 'Clear Cache'}</span>
                  </button>
                )}
              </div>

              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:cacheEnabled?"1px solid var(--v-bdr)":"none"}}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Enable Caching & Stream Prefetch</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>
                    {cacheEnabled
                      ? 'Active — pre-resolves queued songs in background, buffers 30s audio, and caches search queries'
                      : 'Disabled — no cache or prefetch files will be saved, existing cache is purged'}
                  </p>
                </div>
                <SettingsSwitch checked={cacheEnabled} onChange={() => handleToggleCache(!cacheEnabled)} />
              </div>

              {cacheEnabled && (
                <>
                  <div
                    className="v-settings-row"
                    style={{
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid var(--v-bdr)",
                      cursor: cacheInfo?.cache_dir ? "pointer" : "default",
                      transition: "background 0.15s ease-out",
                    }}
                    onClick={() => {
                      if (cacheInfo?.cache_dir) {
                        invoke('open_in_file_manager', { path: cacheInfo.cache_dir }).catch(() => {});
                      }
                    }}
                    title={cacheInfo?.cache_dir ? "Click to open cache folder" : undefined}
                  >
                    <div>
                      <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Current Cache Size</p>
                      <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>
                        {cacheInfo ? `${cacheInfo.formatted_size} (${cacheInfo.file_count} cached media & thumbnail files)` : 'Calculating cache usage...'}
                      </p>
                    </div>
                    {cacheInfo?.cache_dir && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="v-settings-path-capsule" style={{ maxWidth: "260px" }}>
                          <FolderOpen size={12} style={{ color: "var(--v-accent)", flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cacheInfo.cache_dir}</span>
                        </div>
                        <button
                          title="Open Cache Folder"
                          style={{
                            padding: "6px",
                            marginLeft: "4px",
                            color: "#5c5755",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            flexShrink: 0,
                            borderRadius: "7px",
                            display: "flex",
                            transition: "color .12s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#e2ddd9")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#5c5755")}
                        >
                          <FolderOpen size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Cache Size Limit</p>
                      <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>
                        Automatically purges oldest cached streams and temporary artwork when limit is reached
                      </p>
                    </div>
                    <ThemedSelect
                      value={cacheLimit}
                      onChange={handleCacheLimitChange}
                      options={[
                        { value: '500mb', label: '500 MB' },
                        { value: '1gb', label: '1 GB' },
                        { value: '2gb', label: '2 GB' },
                        { value: '5gb', label: '5 GB' },
                        { value: 'unlimited', label: 'Unlimited' },
                      ]}
                    />
                  </div>
                </>
              )}
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",margin:0}}>Backup Location</h3>
              </div>
              <div className="v-settings-row" style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"background 0.15s ease-out"}} onMouseEnter={e=>(e.currentTarget.style.background="rgba(226,221,217,0.005)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")} onClick={async () => {
                try {
                  const sel = await openDialog({ directory: true, multiple: false, defaultPath: backupPath });
                  if (sel) setBackupPath(sel as string);
                } catch {}
              }}>
                <div style={{flex:1,minWidth:0}}>
                  <div className="v-settings-path-capsule" style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12.5px",
                    color: "#9e9894",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--v-bdr)",
                    borderRadius: "20px",
                    padding: "4px 10px",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    fontFamily: "monospace",
                    maxWidth: "90%"
                  }}>
                    <FolderOpen size={13} style={{ color: "var(--v-accent)", flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{backupPath || downloadPath}</span>
                  </div>
                  <p style={{fontSize:"12px",color:"#5c5755",marginTop:"6px"}}>Backup file: veluna_backup.json</p>
                </div>
                <button style={{padding:"6px",marginLeft:"12px",color:"#5c5755",background:"none",border:"none",cursor:"pointer",flexShrink:0,borderRadius:"7px",display:"flex",transition:"color .12s"}} onMouseEnter={e=>(e.currentTarget.style.color="#e2ddd9")} onMouseLeave={e=>(e.currentTarget.style.color="#5c5755")}>
                  <FolderOpen size={16} />
                </button>
              </div>
            </div>

            <div style={{borderRadius:"12px",border:"1px solid var(--v-bdr)",background:"var(--v-bg0)",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--v-bdr)",background:"rgba(226,221,217,0.015)"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#e2ddd9",margin:0}}>Backup & Restore Actions</h3>
              </div>
              
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"background 0.15s ease-out",borderBottom:"1px solid #141312"}} onMouseEnter={e=>(e.currentTarget.style.background="rgba(226,221,217,0.005)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")} onClick={onBackup}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Create Backup</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>Save all playlists, queue, history, and settings to a JSON file</p>
                </div>
                <button style={{padding:"6px",marginLeft:"12px",color:"#5c5755",background:"none",border:"none",cursor:"pointer",flexShrink:0,borderRadius:"7px",display:"flex",transition:"color .12s"}} onMouseEnter={e=>(e.currentTarget.style.color="#e2ddd9")} onMouseLeave={e=>(e.currentTarget.style.color="#5c5755")}>
                  <Upload size={16} />
                </button>
              </div>

              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"background 0.15s ease-out"}} onMouseEnter={e=>(e.currentTarget.style.background="rgba(226,221,217,0.005)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")} onClick={onRestore}>
                <div>
                  <p style={{fontSize:"14px",fontWeight:500,color:"#e2ddd9"}}>Restore Backup</p>
                  <p style={{fontSize:"12px",color:"#6f6966",marginTop:"4px"}}>Restore playlists, history, and preferences from a backup file</p>
                </div>
                <button style={{padding:"6px",marginLeft:"12px",color:"#5c5755",background:"none",border:"none",cursor:"pointer",flexShrink:0,borderRadius:"7px",display:"flex",transition:"color .12s"}} onMouseEnter={e=>(e.currentTarget.style.color="#e2ddd9")} onMouseLeave={e=>(e.currentTarget.style.color="#5c5755")}>
                  <ArchiveRestore size={16} />
                </button>
              </div>
            </div>

            <div style={{borderRadius:"12px",border:"1px solid rgba(239, 68, 68, 0.15)",background:"rgba(239, 68, 68, 0.005)",overflow:"hidden",transition:"all 0.2s"}}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.015)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.005)'; }}
              onClick={onReset}>
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                <div>
                  <h3 style={{fontSize:"14px",fontWeight:600,color:"#ef4444",margin:0}}>Reset Veluna App</h3>
                  <p style={{fontSize:"12px",color:"rgba(239, 68, 68, 0.6)",marginTop:"4px"}}>Permanently delete all local database contents, playlists, history, and configuration files. This action is irreversible.</p>
                </div>
                <button style={{padding:"6px",color:"#ef4444",background:"none",border:"none",cursor:"pointer",display:"flex",flexShrink:0,marginLeft:"10px"}}>
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )
      }
      </div>
    </div>
  );
}
