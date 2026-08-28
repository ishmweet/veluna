import React, { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import {
  AlignLeft,
  CheckCircle,
  Maximize2,
  Music,
  X,
  Trash2,
} from 'lucide-react';

import {
  Track,
  LocalTrack,
  Playlist,
  CtxMenu,
  NavView,
  SettingsTab,
  ActiveDownload,
} from './types';
import {
  loadLS,
  saveLS,
  clampMenu,
  getTrackGradient,
  cleanArtist,
} from './utils';

// Custom Hooks
import { useToast } from './hooks/useToast';
import { useTheme } from './hooks/useTheme';
import { useListeningStats } from './hooks/useListeningStats';
import { useQueue } from './hooks/useQueue';
import { useLyrics } from './hooks/useLyrics';
import { useSearch } from './hooks/useSearch';
import { usePlaylists } from './hooks/usePlaylists';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useScrobbler } from './hooks/useScrobbler';

// Layout Components
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DownloadsFlyout } from './components/layout/DownloadsFlyout';
import { QueuePanel } from './components/layout/QueuePanel';
import { PlayerBar } from './components/layout/PlayerBar';
import { ContextMenu } from './components/layout/ContextMenu';

// View Components
import { HomeView } from './components/views/HomeView';
import { PlaylistsView } from './components/views/PlaylistsView';
import { StatsView } from './components/views/StatsView';
import { LyricsView } from './components/views/LyricsView';
import { DownloadsPanel } from './components/DownloadsPanel';
import { SettingsPanel } from './components/SettingsPanel';

// Modal Components
import {
  ImportResultModal,
  CsvImportModal,
  YtImportModal,
  MetadataEditModal,
  PlaylistDeleteConfirmModal,
} from './components/Modals';

export function App() {
  // 1. Toast hook
  const { toast, showToast } = useToast();

  // 2. Theme & performance hook
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    customBgColor,
    setCustomBgColor,
    performanceMode,
    setPerformanceMode,
  } = useTheme();

  // 3. Listening stats hook
  const {
    playCounts,
    setPlayCounts,
    listenSecs,
    setListenSecs,
    firstSeen,
    setFirstSeen,
    dailyPlays,
    setDailyPlays,
    playHistory,
    setPlayHistory,
    listeningHistory,
    setListeningHistory,
    statsTimeRange,
    setStatsTimeRange,
    artistThumbs,
    recordTrackPlayed,
    recordListeningStep,
  } = useListeningStats();

  // 4. Queue hook
  const {
    queue,
    setQueue,
    queueRef,
    isQueueOpen,
    setIsQueueOpen,
    showClearConfirm,
    setShowClearConfirm,
    queuePulseKey,
    dragQueueIdx,
    dragOverQueueIdx,
    setDragOverQueueIdx,
    dragOverQueueIdxRef,
    clearQueue,
    removeFromQueue,
    reorderQueue: moveQueueItem,
    playNext,
    addToQueue,
  } = useQueue(showToast);

  // Settings & Storage State
  const [cacheEnabled, setCacheEnabledState] = useState<boolean>(() => loadLS('vg_cacheEnabled', true));
  const [uiScale, setUiScaleState] = useState<number>(() => loadLS('vg_uiScale', 0));

  // 5. Search hook
  const {
    searchQuery,
    setSearchQuery,
    searchHistory,
    showHistory,
    setShowHistory,
    isSearching,
    hasSearched,
    searchError,
    searchTab,
    setSearchTab,
    ytMusicTracks,
    videoTracks,
    tracks,
    quickPicks,
    setQuickPicks,
    searchMusic,
    clearSearchHistory,
    removeSearchHistoryItem,
    resetSearch,
  } = useSearch(showToast, cacheEnabled);

  const searchRef = useRef<HTMLInputElement>(null);

  const [volume, setVolume] = useState<number>(() => loadLS('vg_volume', 100));
  const [previousVolume, setPreviousVolume] = useState(100);
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(() => loadLS('vg_speed', 1));
  const [crossfadeSeconds] = useState<number>(() => loadLS('vg_crossfade', 0));
  const [loudnormEnabled, setLoudnormEnabledState] = useState<boolean>(() => loadLS('vg_loudnorm', false));
  const [skipSilence, setSkipSilenceState] = useState<boolean>(() => loadLS('vg_skipSilence', false));
  const [downloadQuality, setDownloadQuality] = useState<string>(() => loadLS('vg_dlQuality', 'High'));
  const [downloadFormat, setDownloadFormatState] = useState<string>(() => loadLS('vg_dlFormat', 'mp3'));
  const [embedThumbnail, setEmbedThumbnailState] = useState<boolean>(() => loadLS('vg_embedThumb', true));
  const [duplicateDetect, setDuplicateDetectState] = useState<boolean>(() => loadLS('vg_dupDetect', true));
  const [autoCheckUpdates, setAutoCheckUpdatesState] = useState<boolean>(() => loadLS('vg_autoCheckUpdates', true));
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [downloadPath, setDownloadPath] = useState<string>(() => loadLS('vg_dlPath', '~/Downloads'));
  const [backupPath, setBackupPathState] = useState<string>(() => loadLS('vg_backupPath', ''));
  const [trayEnabled, setTrayEnabled] = useState<boolean>(() => loadLS('vg_trayEnabled', false));
  const [discordRpcEnabled, setDiscordRpcEnabled] = useState<boolean>(() => loadLS('vg_discordRpcEnabled', true));
  const [autoplayEnabled, setAutoplayEnabled] = useState<boolean>(() => loadLS('vg_autoplay', true));
  const [appVersion, setAppVersion] = useState<string>('0.1.3');
  const [updateAvailable, setUpdateAvailable] = useState<string | null>(null);

  const setCacheEnabled = useCallback((enabled: boolean) => {
    setCacheEnabledState(enabled);
    saveLS('vg_cacheEnabled', enabled);
    invoke('set_cache_enabled', { enabled }).catch(() => {});
  }, []);

  const setUiScale = useCallback((scale: number) => {
    setUiScaleState(scale);
    saveLS('vg_uiScale', scale);
    (document.documentElement.style as any).zoom = `${100 + scale * 5}%`;
  }, []);

  useEffect(() => {
    (document.documentElement.style as any).zoom = `${100 + uiScale * 5}%`;
  }, [uiScale]);

  useEffect(() => {
    invoke('set_cache_enabled', { enabled: cacheEnabled }).catch(() => {});
  }, [cacheEnabled]);

  const [eq, setEqState] = useState<{ bass: number; mid: number; treble: number }>(() =>
    loadLS('vg_eq', { bass: 0, mid: 0, treble: 0 })
  );

  const setAutoCheckUpdates = useCallback((v: boolean) => {
    setAutoCheckUpdatesState(v);
    saveLS('vg_autoCheckUpdates', v);
  }, []);

  const setBackupPath = useCallback((p: string) => {
    setBackupPathState(p);
    saveLS('vg_backupPath', p);
  }, []);

  useEffect(() => { saveLS('vg_volume', volume); }, [volume]);
  useEffect(() => { saveLS('vg_speed', playbackSpeed); }, [playbackSpeed]);
  useEffect(() => { saveLS('vg_dlQuality', downloadQuality); }, [downloadQuality]);
  useEffect(() => { saveLS('vg_dlFormat', downloadFormat); }, [downloadFormat]);
  useEffect(() => { saveLS('vg_embedThumb', embedThumbnail); }, [embedThumbnail]);
  useEffect(() => { saveLS('vg_dupDetect', duplicateDetect); }, [duplicateDetect]);
  useEffect(() => { saveLS('vg_dlPath', downloadPath); }, [downloadPath]);
  useEffect(() => { saveLS('vg_eq', eq); }, [eq]);
  useEffect(() => { saveLS('vg_trayEnabled', trayEnabled); }, [trayEnabled]);
  useEffect(() => { saveLS('vg_discordRpcEnabled', discordRpcEnabled); }, [discordRpcEnabled]);
  useEffect(() => { saveLS('vg_autoplay', autoplayEnabled); }, [autoplayEnabled]);
  useEffect(() => {
    saveLS('vg_loudnorm', loudnormEnabled);
    invoke('set_loudnorm_enabled', { enabled: loudnormEnabled }).catch(() => {});
  }, [loudnormEnabled]);
  useEffect(() => {
    saveLS('vg_skipSilence', skipSilence);
    invoke('set_skip_silence', { enabled: skipSilence }).catch(() => {});
  }, [skipSilence]);

  // 6. Audio Player Hook
  const {
    currentTrack,
    currentTrackRef,
    setCurrentTrack,
    currentLocalPath,
    isPlaying,
    isLoadingTrack,
    loadingTrackUrl,
    audioInfo,
    progressSeconds,
    trackDurationSeconds,
    waveformData,
    abLoop,
    setAbLoop,
    shuffle,
    repeatMode,
    toggleShuffle,
    cycleRepeat,
    playlistContextRef,
    sleepTimer,
    showSleepPopover,
    setShowSleepPopover,
    setSleepTimerMinutes,
    cancelSleepTimer,
    handlePlayTrack,
    handlePlayLocalTrack,
    handlePlayInContext,
    togglePlayPause,
    toggleMute,
    handleSkipForward,
    handleSkipBack,
    prefetchOnHover,
    progressRef,
    volumeRef,
    isDraggingProgress,
    setIsDraggingProgress,
    isDraggingProgressRef,
    isDraggingVolume,
    setIsDraggingVolume,
    progressSecondsRef,
    abLoopRef,
    trackDurationRef,
    updateProgressFromEvent,
    updateVolumeFromEvent,
    calculateProgressPercent,
  } = useAudioPlayer({
    volume,
    setVolume,
    previousVolume,
    setPreviousVolume,
    eq,
    playbackSpeed,
    setPlaybackSpeed: setPlaybackSpeedState,
    crossfadeSeconds,
    autoplayEnabled,
    queue,
    setQueue,
    queueRef,
    playHistory,
    setPlayHistory,
    setQuickPicks,
    onTrackPlayed: recordTrackPlayed,
    onListeningStep: recordListeningStep,
    showToast,
  });

  // 7. Lyrics hook
  const {
    showLyrics,
    setShowLyrics,
    lyricsData,
    lyricsLoading,
    lyricsSource,
    setLyricsSource,
    lyricsScrollContainerRef,
  } = useLyrics(currentTrack, trackDurationSeconds, progressSeconds);

  const {
    listenbrainzEnabled,
    setListenbrainzEnabled,
    listenbrainzToken,
    setListenbrainzToken,
    listenbrainzUsername,
    setListenbrainzUsername,
    lastfmEnabled,
    setLastfmEnabled,
    lastfmSessionKey,
    setLastfmSessionKey,
    lastfmApiKey,
    setLastfmApiKey,
    lastfmApiSecret,
    setLastfmApiSecret,
    lastfmUsername,
    setLastfmUsername,
  } = useScrobbler({
    currentTrack,
    isPlaying,
    progressSeconds,
    trackDurationSeconds,
    showToast,
  });

  // Local tracks & downloads state
  const [localTracks, setLocalTracks] = useState<LocalTrack[]>([]);
  const [localRefreshNonce, setLocalRefreshNonce] = useState(0);
  const [downloadingTracks, setDownloadingTracks] = useState<Record<string, number>>({});
  const [activeDownloads, setActiveDownloads] = useState<ActiveDownload[]>([]);
  const [isDownloadsFlyoutOpen, setIsDownloadsFlyoutOpen] = useState(false);
  const [downloadPulseKey, setDownloadPulseKey] = useState(0);
  const flyoutAutoCloseTimerRef = useRef<any>(null);
  const [metadataEditingTrack, setMetadataEditingTrack] = useState<Track | null>(null);

  // Listen to live download progress events from Rust
  useEffect(() => {
    const unlistenPromise = listen<{ url: string; percent: number; status: string; error?: string }>('download_progress', (event) => {
      const { url, percent, status, error } = event.payload;
      setDownloadingTracks(p => ({ ...p, [url]: percent }));
      setActiveDownloads(prev => prev.map(item => {
        if (item.url === url) {
          return {
            ...item,
            progress: percent,
            status: status === 'completed' || percent >= 100 ? 'completed' : error ? 'error' : 'downloading',
            error,
          };
        }
        return item;
      }));
    });
    return () => {
      unlistenPromise.then(fn => fn());
    };
  }, []);

  const getTrackCover = useCallback((track: Track | null | undefined) => {
    if (!track) return '';
    if (track.cover) return track.cover;
    if (track.url?.startsWith('local://')) {
      const path = track.url.slice(8);
      const found = localTracks.find(lt => lt.path === path);
      if (found && found.cover) return found.cover;
    }
    return '';
  }, [localTracks]);

  // 8. Playlists hook
  const {
    playlists,
    setPlaylists,
    openPlaylistId,
    setOpenPlaylistId,
    selectedPlaylistIds,
    setSelectedPlaylistIds,
    isPlaylistMultiSelect,
    setIsPlaylistMultiSelect,
    playlistViewMode,
    setPlaylistViewMode,
    playlistSearchQ,
    setPlaylistSearchQ,
    isPlaylistModalOpen,
    setIsPlaylistModalOpen,
    newPlaylistName,
    setNewPlaylistName,
    newPlaylistDesc,
    setNewPlaylistDesc,
    renamingPlaylist,
    setRenamingPlaylist,
    renameVal,
    setRenameVal,
    renameDescVal,
    setRenameDescVal,
    playlistDeleteModal,
    setPlaylistDeleteModal,
    toggleLikeTrack,
    isTrackLiked,
    confirmCreatePlaylist,
    confirmRenamePlaylist,
    confirmDeletePlaylist,
    handleCoverUpload: handlePlaylistCoverUpload,
  } = usePlaylists(showToast);

  const getPlaylistCover = useCallback((p: Playlist) => p.id === 'p1' ? null : (p.customCover || (p.tracks.find(t => t.cover)?.cover || null)), []);

  // Navigation state
  const [startupNav, setStartupNavState] = useState<string>(() => loadLS('vg_startupNav', 'home'));
  const setStartupNav = useCallback((nav: string) => {
    setStartupNavState(nav);
    saveLS('vg_startupNav', nav);
  }, []);

  const [activeNav, setActiveNavState] = useState<NavView>(() => {
    const startup = loadLS<string>('vg_startupNav', 'home');
    if (startup === 'last') return loadLS<NavView>('vg_lastNav', 'home');
    if (startup === 'library' || startup === 'playlists') return 'playlists';
    if (['home', 'downloads', 'stats', 'settings'].includes(startup)) return startup as NavView;
    return 'home';
  });

  const [navHistory, setNavHistory] = useState<NavView[]>(() => {
    const startup = loadLS<string>('vg_startupNav', 'home');
    const initial: NavView = (startup === 'last')
      ? loadLS<NavView>('vg_lastNav', 'home')
      : (startup === 'library' || startup === 'playlists')
        ? 'playlists'
        : ['home', 'downloads', 'stats', 'settings'].includes(startup)
          ? (startup as NavView)
          : 'home';
    return [initial];
  });
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('playback');

  const setActiveNav = useCallback((nav: NavView) => {
    setActiveNavState(nav);
    saveLS('vg_lastNav', nav);
    setNavHistory(prev => [...prev.filter(n => n !== nav), nav]);
  }, []);

  const navigateBack = useCallback(() => {
    if (activeNav === 'home' && (searchQuery || hasSearched)) {
      resetSearch();
      return;
    }
    if (activeNav === 'playlists' && openPlaylistId) {
      setOpenPlaylistId(null);
      return;
    }
    if (navHistory.length > 1) {
      const newHistory = [...navHistory];
      newHistory.pop();
      const prevNav = newHistory[newHistory.length - 1];
      setNavHistory(newHistory);
      setActiveNavState(prevNav);
      saveLS('vg_lastNav', prevNav);
    } else if (activeNav !== 'home') {
      setActiveNav('home');
    }
  }, [activeNav, searchQuery, hasSearched, resetSearch, openPlaylistId, navHistory, setActiveNav, setOpenPlaylistId]);

  // Context menu & UI state
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [infoModalTrack, setInfoModalTrack] = useState<Track | null>(null);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<Track | null>(null);
  const [hoveredTrackUrl, setHoveredTrackUrl] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [showYtImportModal, setShowYtImportModal] = useState(false);
  const [bgImport, setBgImport] = useState<{ matched: number; total: number; label: string } | null>(null);
  const [bgYtImport, setBgYtImport] = useState<{ progress: number } | null>(null);
  const [pendingSpotifyImport, setPendingSpotifyImport] = useState<{ tracks: Track[]; matchedCount: number; failedCount: number } | null>(null);
  const [showDuplicatesPlaylist, setShowDuplicatesPlaylist] = useState<Playlist | null>(null);
  const [bulkEditPlaylist, setBulkEditPlaylist] = useState<Playlist | null>(null);

  const openCtx = useCallback((e: React.MouseEvent, menu: Omit<CtxMenu, 'x' | 'y'>) => {
    e.preventDefault();
    e.stopPropagation();
    const { x, y } = clampMenu(e.clientX, e.clientY);
    setCtxMenu({ x, y, ...menu });
  }, []);

  // MPRIS refs
  const mprisToggleRef = useRef<() => void>(() => {});
  const mprisNextRef = useRef<() => void>(() => {});
  const mprisPrevRef = useRef<() => void>(() => {});
  mprisToggleRef.current = togglePlayPause;
  mprisNextRef.current = handleSkipForward;
  mprisPrevRef.current = handleSkipBack;

  useEffect(() => {
    const unlisteners: (() => void)[] = [];
    listen('mpris_play_pause', () => mprisToggleRef.current()).then(fn => unlisteners.push(fn));
    listen('mpris_next', () => mprisNextRef.current()).then(fn => unlisteners.push(fn));
    listen('mpris_prev', () => mprisPrevRef.current()).then(fn => unlisteners.push(fn));
    listen('tray_play_pause', () => mprisToggleRef.current()).then(fn => unlisteners.push(fn));
    listen('tray_next', () => mprisNextRef.current()).then(fn => unlisteners.push(fn));
    listen('tray_prev', () => mprisPrevRef.current()).then(fn => unlisteners.push(fn));

    if (trayEnabled) {
      invoke('tray_set', { enabled: true }).catch(() => {});
    }

    return () => unlisteners.forEach(fn => fn());
  }, []);

  useEffect(() => {
    if (trayEnabled) {
      invoke('tray_update_title', {
        title: currentTrack?.title || null,
        artist: currentTrack?.artist || null,
        isPlaying,
      }).catch(() => {});
    }
  }, [currentTrack?.title, currentTrack?.artist, isPlaying, trayEnabled]);

  // Background Cache Auto-Pruning
  useEffect(() => {
    if (!cacheEnabled) return;
    const limit = loadLS<string>('vg_cacheLimit', '1gb');
    const limitMap: Record<string, number> = {
      '500mb': 500 * 1024 * 1024,
      '1gb': 1024 * 1024 * 1024,
      '2gb': 2 * 1024 * 1024 * 1024,
      '5gb': 5 * 1024 * 1024 * 1024,
      'unlimited': 0,
    };
    const maxBytes = limitMap[limit] ?? 1024 * 1024 * 1024;
    invoke('prune_cache_if_needed', { maxBytes }).catch(() => {});
  }, [currentTrack?.url, cacheEnabled]);

  // MPRIS metadata sync
  useEffect(() => {
    if (!currentTrack) return;
    const parseDuration = (d: string): number => {
      const parts = d.split(':').map(Number);
      if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
      if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
      return 0;
    };
    invoke('set_mpris_metadata', {
      title: currentTrack.title ?? '',
      artist: currentTrack.artist ?? '',
      coverUrl: currentTrack.cover ?? '',
      durationSecs: parseDuration(currentTrack.duration ?? '0:00'),
      playing: isPlaying,
    }).catch(() => {});
  }, [currentTrack, isPlaying]);

  // Discord RPC presence synchronization
  const lastRpcProgressRef = useRef<number>(0);
  useEffect(() => {
    if (discordRpcEnabled && isPlaying && currentTrack) {
      const delta = Math.abs(progressSeconds - lastRpcProgressRef.current);
      // Update RPC on initial play, track switch, or when user seeks/skips (> 2s jump)
      if (delta > 2 || lastRpcProgressRef.current === 0) {
        lastRpcProgressRef.current = progressSeconds;
        const coverUrl = currentTrack.cover && !currentTrack.cover.startsWith('data:') && !currentTrack.cover.startsWith('blob:') ? currentTrack.cover : null;
        const trackUrl = currentTrack.url && currentTrack.url.startsWith('http') ? currentTrack.url : null;
        const now = Math.floor(Date.now() / 1000);
        const remainingSecs = Math.max(0, trackDurationSeconds - progressSeconds);
        const startTimestamp = now - Math.floor(progressSeconds);
        const endTimestamp = trackDurationSeconds > 0 ? now + Math.floor(remainingSecs) : null;

        invoke('update_discord_rpc', {
          title: currentTrack.title,
          artist: cleanArtist(currentTrack.artist) || null,
          coverUrl,
          trackUrl,
          startTimestamp,
          endTimestamp
        }).catch(() => {});
      }
    } else {
      lastRpcProgressRef.current = 0;
      invoke('clear_discord_rpc').catch(() => {});
    }
  }, [discordRpcEnabled, isPlaying, currentTrack, trackDurationSeconds, progressSeconds]);

  // App version & Update check
  useEffect(() => {
    invoke<string>('get_app_version').then(setAppVersion).catch(() => {});
    const autoCheck = loadLS('vg_autoCheckUpdates', true);
    if (autoCheck) {
      invoke<string | null>('check_for_update').then(v => setUpdateAvailable(v ?? null)).catch(() => {});
    }
  }, []);

  const handleCheckUpdate = useCallback(async () => {
    setIsCheckingUpdate(true);
    try {
      const v = await invoke<string | null>('check_for_update');
      setUpdateAvailable(v ?? null);
      if (v) showToast(`Update available: v${v}`);
      else showToast("You're up to date!");
    } catch (e) {
      showToast(`Failed to check updates: ${e}`);
    } finally {
      setIsCheckingUpdate(false);
    }
  }, [showToast]);

  // Global Keybindings
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

      if (e.ctrlKey || e.metaKey) {
        if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          e.stopPropagation();
          if (activeNav !== 'home') {
            setActiveNav('home');
            setTimeout(() => {
              searchRef.current?.focus();
              searchRef.current?.select();
            }, 100);
          } else {
            searchRef.current?.focus();
            searchRef.current?.select();
          }
          return;
        }

        if (e.code === 'Digit1' || e.key === '1') {
          e.preventDefault();
          setActiveNav('home');
          return;
        }

        if (e.code === 'Digit2' || e.key === '2') {
          e.preventDefault();
          setActiveNav('downloads');
          return;
        }

        if (e.code === 'Digit3' || e.key === '3') {
          e.preventDefault();
          setActiveNav('stats');
          return;
        }

        if (e.code === 'Digit4' || e.key === '4') {
          e.preventDefault();
          setActiveNav('settings');
          return;
        }

        if (e.code === 'Digit5' || e.key === '5') {
          e.preventDefault();
          setIsQueueOpen(prev => !prev);
          return;
        }

        if (e.code === 'KeyP' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setOpenPlaylistId(null);
          setActiveNav('playlists');
          return;
        }
      }

      if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && !isInput) {
        const digitMatch = e.code.match(/^Digit([1-9])$/);
        if (digitMatch) {
          const num = parseInt(digitMatch[1], 10);
          const targetIdx = num - 1;
          if (playlists[targetIdx]) {
            e.preventDefault();
            setActiveNav('playlists');
            setOpenPlaylistId(playlists[targetIdx].id);
            showToast(`Opened "${playlists[targetIdx].name}"`);
            return;
          }
        }
      }

      if (e.code === 'Space' && !isInput) { e.preventDefault(); togglePlayPause(); }
      if (e.code === 'ArrowRight' && !isInput && currentTrackRef.current) { e.preventDefault(); invoke('seek_relative', { seconds: 10 }).catch(() => {}); }
      if (e.code === 'ArrowLeft' && !isInput && currentTrackRef.current) { e.preventDefault(); invoke('seek_relative', { seconds: -10 }).catch(() => {}); }
      if (e.code === 'KeyM' && !isInput) toggleMute();
      if (e.key === '?' && !isInput) { e.preventDefault(); setShowShortcuts(s => !s); }
      if (e.code === 'Escape') { setShowShortcuts(false); setConfirmModal(null); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [togglePlayPause, toggleMute, searchRef, currentTrackRef, activeNav, setActiveNav, setIsQueueOpen, setOpenPlaylistId, playlists, showToast]);

  // Global click dismiss
  useEffect(() => {
    const h = () => {
      setCtxMenu(null);
      setShowHistory(false);
      setShowSleepPopover(false);
    };
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, [setShowHistory, setShowSleepPopover]);

  // Download handlers
  const handleCancelDownload = useCallback(async (url: string) => {
    try { await invoke('cancel_download', { url }); } catch {}
    setDownloadingTracks(p => { const n = { ...p }; delete n[url]; return n; });
    setActiveDownloads(prev => prev.filter(d => d.url !== url));
    showToast('Download cancelled');
  }, [showToast]);

  const handleDownload = useCallback(async (track: Track) => {
    if (downloadingTracks[track.url] !== undefined) {
      handleCancelDownload(track.url);
      return;
    }
    if (duplicateDetect) {
      try {
        const scanned: LocalTrack[] = await invoke('scan_downloads', { path: downloadPath });
        const existing = scanned.map(t => t.title.toLowerCase());
        if (existing.includes(track.title.toLowerCase())) {
          showToast(`Already downloaded: ${track.title}`);
          return;
        }
      } catch {}
    }
    setDownloadingTracks(p => ({ ...p, [track.url]: 1 }));
    setActiveDownloads(prev => [
      {
        url: track.url,
        title: track.title,
        artist: track.artist || 'YouTube Music',
        cover: track.cover,
        progress: 5,
        status: 'downloading',
        startedAt: Date.now(),
      },
      ...prev.filter(d => d.url !== track.url),
    ]);

    // Animate TopBar downloads icon and pop the flyout window to grab user's attention
    setDownloadPulseKey(k => k + 1);
    setIsDownloadsFlyoutOpen(true);
    if (flyoutAutoCloseTimerRef.current) clearTimeout(flyoutAutoCloseTimerRef.current);
    flyoutAutoCloseTimerRef.current = setTimeout(() => {
      setIsDownloadsFlyoutOpen(false);
    }, 6500);

    try {
      await invoke('download_song', {
        url: track.url,
        quality: downloadQuality,
        format: downloadFormat,
        embedThumbnail,
        path: downloadPath,
      });
      setDownloadingTracks(p => ({ ...p, [track.url]: 100 }));
      setActiveDownloads(prev => prev.map(item => item.url === track.url ? { ...item, progress: 100, status: 'completed' } : item));
      setTimeout(() => setDownloadingTracks(p => { const n = { ...p }; delete n[track.url]; return n; }), 1200);
      showToast(`Downloaded: ${track.title}`);
      setLocalRefreshNonce(n => n + 1);
    } catch (e: any) {
      const msg = typeof e === 'string' ? e : e?.message || '';
      if (!msg.includes('cancelled')) showToast(`Download failed: ${msg}`);
      setDownloadingTracks(p => { const n = { ...p }; delete n[track.url]; return n; });
      setActiveDownloads(prev => prev.map(item => item.url === track.url ? { ...item, status: 'error', error: msg } : item));
    }
  }, [downloadingTracks, duplicateDetect, downloadPath, downloadQuality, downloadFormat, embedThumbnail, handleCancelDownload, showToast]);

  const handleDeleteLocalTrack = useCallback(async (t: LocalTrack) => {
    try {
      await invoke('delete_local_file', { path: t.path });
      showToast(`Deleted: ${t.title}`);
      setLocalRefreshNonce(n => n + 1);
    } catch (e) {
      showToast(`Delete failed: ${e}`);
    }
  }, [showToast]);

  const handleOpenInFileManager = useCallback((p: string) => {
    invoke('open_in_file_manager', { path: p }).catch(() => {});
  }, []);

  const handleSaveMetadata = useCallback(async (title: string, artist: string, album: string) => {
    if (!metadataEditingTrack) return;
    const path = metadataEditingTrack.url.substring(8);
    try {
      await invoke('write_audio_metadata', { path, title, artist, album });
      const newPath: string = await invoke('rename_local_file', { oldPath: path, newTitle: title.trim() });
      const newUrl = `local://${newPath}`;
      
      const updateSynth = (t: Track | null): Track | null => {
        if (!t || t.url !== metadataEditingTrack.url) return t;
        return { ...t, title, artist, url: newUrl };
      };
      
      if (currentTrack && currentTrack.url === metadataEditingTrack.url) {
        setCurrentTrack(updateSynth(currentTrack));
      }
      setQueue(prev => prev.map(t => t.url === metadataEditingTrack.url ? (updateSynth(t) || t) : t));
      setPlayHistory(prev => prev.map(t => t.url === metadataEditingTrack.url ? (updateSynth(t) || t) : t));
      setPlaylists(prev => prev.map(pl => ({
        ...pl,
        tracks: pl.tracks.map(t => t.url === metadataEditingTrack.url ? (updateSynth(t) || t) : t)
      })));
      setLocalTracks(prev => prev.map(t => t.path === path ? { ...t, title, artist, path: newPath } : t));
      showToast('Metadata updated successfully');
      setMetadataEditingTrack(null);
      setLocalRefreshNonce(prev => prev + 1);
    } catch (e) {
      showToast(`Failed to save metadata: ${e}`);
      throw e;
    }
  }, [metadataEditingTrack, currentTrack, setCurrentTrack, setQueue, setPlayHistory, setPlaylists, showToast]);

  const handleSelectDirectory = useCallback(async () => {
    try {
      const sel = await open({ directory: true, multiple: false, defaultPath: downloadPath });
      if (sel) setDownloadPath(sel as string);
    } catch {}
  }, [downloadPath]);

  const handleExportPlaylistM3u = useCallback(async (playlist: Playlist) => {
    try {
      const tracksData = playlist.tracks.map(t => ({
        title: t.title,
        artist: t.artist || '',
        url: t.url,
        duration_secs: 0,
      }));
      const safeName = playlist.name.replace(/[/\\:*?"<>|]/g, '_');
      const path = `${downloadPath}/${safeName}.m3u`;
      await invoke('export_playlist_m3u', { tracks: tracksData, path });
      showToast(`Exported "${playlist.name}" to ${path}`);
    } catch (e) { showToast(`Export failed: ${e}`); }
  }, [downloadPath, showToast]);

  const handleExportLocalTracksM3u = useCallback(async (ts: LocalTrack[]) => {
    try {
      const tracksData = ts.map(t => ({
        title: t.title,
        artist: t.artist || '',
        url: `local://${t.path}`,
        duration_secs: 0,
      }));
      const path = `${downloadPath}/Local_Library.m3u`;
      await invoke('export_playlist_m3u', { tracks: tracksData, path });
      showToast(`Exported local library to ${path}`);
    } catch (e) { showToast(`Export failed: ${e}`); }
  }, [downloadPath, showToast]);

  const handleImportPlaylistM3u = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.m3u,.m3u8';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.onchange = async (e) => {
      document.body.removeChild(input);
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length) { showToast('Empty M3U file'); return; }

        const importedTracks: Track[] = [];
        let pendingTitle = '';
        let pendingArtist = '';

        for (const line of lines) {
          if (line.startsWith('#EXTINF:')) {
            const meta = line.slice(line.indexOf(',') + 1);
            const dashIdx = meta.indexOf(' - ');
            if (dashIdx !== -1) {
              pendingArtist = meta.slice(0, dashIdx).trim();
              pendingTitle = meta.slice(dashIdx + 3).trim();
            } else {
              pendingTitle = meta.trim();
              pendingArtist = '';
            }
          } else if (!line.startsWith('#')) {
            const url = line;
            const ytId = url.match(/(?:[?&]v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1] || '';
            if (!pendingTitle) {
              pendingTitle = ytId ? 'YouTube Track' : url.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Track';
            }
            importedTracks.push({
              id: Date.now() + importedTracks.length,
              title: pendingTitle,
              artist: pendingArtist,
              duration: '0:00',
              url,
              cover: ytId ? `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg` : '',
            });
            pendingTitle = '';
            pendingArtist = '';
          }
        }

        if (!importedTracks.length) { showToast('No tracks found in M3U file'); return; }
        const name = file.name.replace(/\.m3u8?$/i, '');
        setPlaylists(prev => [...prev, {
          id: `pl_${Date.now()}`,
          name,
          description: `Imported from ${file.name}`,
          tracks: importedTracks,
        }]);
        showToast(`Imported "${name}" — ${importedTracks.length} track${importedTracks.length !== 1 ? 's' : ''}`);
      } catch (err) {
        showToast(`Import failed: ${err}`);
      }
    };
    input.click();
  }, [showToast, setPlaylists]);

  // Backup & Restore
  const handleBackup = useCallback(async () => {
    try {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        playlists, queue, playHistory, playCounts, listenSecs, dailyPlays, firstSeen, listeningHistory,
        shuffle, repeatMode, volume, playbackSpeed, eq,
        downloadQuality, downloadFormat, downloadPath, backupPath,
        embedThumbnail, duplicateDetect, loudnormEnabled, skipSilence,
        searchHistory, quickPicks, currentTrack,
      };
      const json = JSON.stringify(data, null, 2);
      const sep = navigator.platform.includes('Win') ? '\\' : '/';
      const resolvedBase = backupPath || downloadPath || '';
      if (resolvedBase) {
        const filePath = resolvedBase.replace(/[/\\]$/, '') + sep + 'veluna_backup.json';
        await invoke('write_text_file', { path: filePath, content: json });
        showToast(`Backup saved to ${filePath}`);
      } else {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'veluna_backup.json'; a.click();
        URL.revokeObjectURL(url);
        showToast('Backup saved');
      }
    } catch (e) { showToast(`Backup failed: ${e}`); }
  }, [playlists, queue, playHistory, playCounts, listenSecs, dailyPlays, firstSeen, listeningHistory,
      shuffle, repeatMode, volume, playbackSpeed, eq, downloadQuality, downloadFormat, downloadPath,
      backupPath, embedThumbnail, duplicateDetect, loudnormEnabled, skipSilence, searchHistory,
      quickPicks, currentTrack, showToast]);

  const handleRestore = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.onchange = async (e) => {
      document.body.removeChild(input);
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.version !== 1) { showToast('Invalid backup file'); return; }
        const ls = <T,>(key: string, val: T): T => { saveLS(key, val); return val; };
        if (data.playlists) setPlaylists(ls('vg_playlists', data.playlists));
        if (data.queue) setQueue(ls('vg_queue', data.queue));
        if (data.playHistory) setPlayHistory(ls('vg_playHistory', data.playHistory));
        if (data.playCounts) setPlayCounts(ls('vg_playCounts', data.playCounts));
        if (data.listenSecs) setListenSecs(ls('vg_listenSecs', data.listenSecs));
        if (data.dailyPlays) setDailyPlays(ls('vg_dailyPlays', data.dailyPlays));
        if (data.firstSeen) setFirstSeen(ls('vg_firstSeen', data.firstSeen));
        if (data.listeningHistory) setListeningHistory(ls('vg_listeningHistory', data.listeningHistory));
        if (data.volume !== undefined) { setVolume(ls('vg_volume', data.volume)); invoke('set_volume', { volume: data.volume }).catch(() => {}); }
        if (data.playbackSpeed) setPlaybackSpeedState(ls('vg_speed', data.playbackSpeed));
        if (data.eq) setEqState(ls('vg_eq', data.eq));
        if (data.downloadQuality) setDownloadQuality(ls('vg_dlQuality', data.downloadQuality));
        if (data.downloadFormat) setDownloadFormatState(ls('vg_dlFormat', data.downloadFormat));
        if (data.downloadPath) setDownloadPath(ls('vg_dlPath', data.downloadPath));
        if (data.backupPath) setBackupPath(ls('vg_backupPath', data.backupPath));
        if (data.currentTrack) setCurrentTrack(data.currentTrack);
        showToast('Backup restored successfully');
      } catch (err) {
        showToast(`Restore failed: ${err}`);
      }
    };
    input.click();
  }, [showToast, setPlaylists, setQueue, setPlayHistory, setPlayCounts, setListenSecs, setDailyPlays, setFirstSeen, setListeningHistory, setVolume, setBackupPath, setCurrentTrack]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        background: "var(--v-bg0)",
        color: "var(--v-fg)",
        overflow: "hidden",
        fontSize: "16px",
      }}
      onContextMenu={e => e.preventDefault()}
    >
      {/* 1. Main Content Body (Sidebar + View + Queue Panel) */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
        {/* Sidebar */}
        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          playlists={playlists}
          openPlaylistId={openPlaylistId}
          setOpenPlaylistId={setOpenPlaylistId}
          performanceMode={performanceMode}
          setSettingsTab={setSettingsTab}
          isQueueOpen={isQueueOpen}
          setIsQueueOpen={setIsQueueOpen}
          queueLength={queue.length}
          queuePulseKey={queuePulseKey}
          setIsPlaylistModalOpen={setIsPlaylistModalOpen}
          setNewPlaylistName={setNewPlaylistName}
          setNewPlaylistDesc={setNewPlaylistDesc}
          setShowCsvImportModal={setShowCsvImportModal}
          setShowYtImportModal={setShowYtImportModal}
          handleImportPlaylistM3u={handleImportPlaylistM3u}
          openCtx={openCtx}
          getPlaylistCover={getPlaylistCover}
        />

        {/* Main View Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, overflow: "hidden", position: "relative", zIndex: 1 }}>
        <TopBar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          openPlaylistId={openPlaylistId}
          setOpenPlaylistId={setOpenPlaylistId}
          hasSearched={hasSearched}
          tracks={tracks}
          ytMusicTracks={ytMusicTracks}
          videoTracks={videoTracks}
          isSearching={isSearching}
          navHistory={navHistory}
          navigateBack={navigateBack}
          resetSearch={resetSearch}
          activeDownloads={activeDownloads}
          isDownloadsFlyoutOpen={isDownloadsFlyoutOpen}
          setIsDownloadsFlyoutOpen={setIsDownloadsFlyoutOpen}
          downloadPulseKey={downloadPulseKey}
          onOpenShortcuts={() => setShowShortcuts(s => !s)}
        />

        <DownloadsFlyout
          isOpen={isDownloadsFlyoutOpen}
          onClose={() => setIsDownloadsFlyoutOpen(false)}
          downloads={activeDownloads}
          onCancelDownload={handleCancelDownload}
          onClearCompleted={() => setActiveDownloads(prev => prev.filter(d => d.status === 'downloading'))}
          onOpenFolder={() => handleOpenInFileManager(downloadPath)}
          onNavigateToDownloads={() => {
            setActiveNav('downloads');
            setIsDownloadsFlyoutOpen(false);
          }}
        />

        {/* View Routing */}
        {activeNav === 'home' && (
          <HomeView
            searchRef={searchRef}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchHistory={searchHistory}
            showHistory={showHistory}
            setShowHistory={setShowHistory}
            isSearching={isSearching}
            hasSearched={hasSearched}
            searchError={searchError}
            searchTab={searchTab}
            setSearchTab={setSearchTab}
            tracks={tracks}
            ytMusicTracks={ytMusicTracks}
            videoTracks={videoTracks}
            quickPicks={quickPicks}
            playCounts={playCounts}
            playHistory={playHistory}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            isLoadingTrack={isLoadingTrack}
            loadingTrackUrl={loadingTrackUrl}
            searchMusic={searchMusic}
            handlePlayTrack={handlePlayTrack}
            handlePlayInContext={handlePlayInContext}
            handleDownload={handleDownload}
            downloadingTracks={downloadingTracks}
            openCtx={openCtx}
            isTrackLiked={isTrackLiked}
            toggleLikeTrack={toggleLikeTrack}
            clearSearchHistory={clearSearchHistory}
            removeSearchHistoryItem={removeSearchHistoryItem}
            prefetchOnHover={prefetchOnHover}
            hoveredTrackUrl={hoveredTrackUrl}
            setHoveredTrackUrl={setHoveredTrackUrl}
            setActiveNav={setActiveNav}
            setPlaylists={setPlaylists}
            playlists={playlists}
            showToast={showToast}
            updateAvailable={updateAvailable}
            setSettingsTab={setSettingsTab}
            getTrackCover={getTrackCover}
            localTracks={localTracks}
          />
        )}

        {activeNav === 'downloads' && (
          <DownloadsPanel
            downloadPath={downloadPath}
            onPlayLocalTrack={handlePlayLocalTrack}
            onDeleteLocalTrack={handleDeleteLocalTrack}
            currentTrackPath={currentLocalPath}
            isPlaying={isPlaying}
            isLoadingTrack={isLoadingTrack}
            onOpenInFileManager={handleOpenInFileManager}
            onExportM3u={handleExportLocalTracksM3u}
            onChangeFolder={handleSelectDirectory}
            refreshNonce={localRefreshNonce}
            onCtx={(e: React.MouseEvent, track: LocalTrack) => openCtx(e, {
              type: 'local',
              track: {
                id: 0,
                title: track.title,
                artist: track.artist || '',
                url: `local://${track.path}`,
                cover: track.cover || '',
                duration: track.duration || '0:00',
              },
              localTracksList: localTracks,
              localTrackIndex: localTracks.findIndex(t => t.path === track.path),
            })}
            tracks={localTracks}
            setTracks={setLocalTracks}
          />
        )}

        {(activeNav === 'playlists' || activeNav === 'library') && (
          <PlaylistsView
            playlists={playlists}
            setPlaylists={setPlaylists}
            openPlaylistId={openPlaylistId}
            setOpenPlaylistId={setOpenPlaylistId}
            playlistViewMode={playlistViewMode}
            setPlaylistViewMode={setPlaylistViewMode}
            isPlaylistMultiSelect={isPlaylistMultiSelect}
            setIsPlaylistMultiSelect={setIsPlaylistMultiSelect}
            selectedPlaylistIds={selectedPlaylistIds}
            setSelectedPlaylistIds={setSelectedPlaylistIds}
            playlistSearchQ={playlistSearchQ}
            setPlaylistSearchQ={setPlaylistSearchQ}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            isLoadingTrack={isLoadingTrack}
            loadingTrackUrl={loadingTrackUrl}
            handlePlayTrack={handlePlayTrack}
            handlePlayInContext={handlePlayInContext}
            handleDownload={handleDownload}
            downloadingTracks={downloadingTracks}
            openCtx={openCtx}
            isTrackLiked={isTrackLiked}
            toggleLikeTrack={toggleLikeTrack}
            setIsPlaylistModalOpen={setIsPlaylistModalOpen}
            setShowCsvImportModal={setShowCsvImportModal}
            setShowYtImportModal={setShowYtImportModal}
            handleImportPlaylistM3u={handleImportPlaylistM3u}
            setPlaylistDeleteModal={setPlaylistDeleteModal}
            setRenamingPlaylist={setRenamingPlaylist}
            setRenameVal={setRenameVal}
            setRenameDescVal={setRenameDescVal}
            handlePlaylistCoverUpload={handlePlaylistCoverUpload}
            playHistory={playHistory}
            setPlayHistory={setPlayHistory}
            listenSecs={listenSecs}
            playCounts={playCounts}
            showToast={showToast}
            getPlaylistCover={getPlaylistCover}
          />
        )}

        {activeNav === 'stats' && (
          <StatsView
            listenSecs={listenSecs}
            setListenSecs={setListenSecs}
            playCounts={playCounts}
            setPlayCounts={setPlayCounts}
            dailyPlays={dailyPlays}
            setDailyPlays={setDailyPlays}
            firstSeen={firstSeen}
            setFirstSeen={setFirstSeen}
            playHistory={playHistory}
            setPlayHistory={setPlayHistory}
            listeningHistory={listeningHistory}
            setListeningHistory={setListeningHistory}
            statsTimeRange={statsTimeRange}
            setStatsTimeRange={setStatsTimeRange}
            quickPicks={quickPicks}
            playlists={playlists}
            handlePlayInContext={handlePlayInContext}
            setSearchQuery={setSearchQuery}
            searchMusic={searchMusic}
            setActiveNav={setActiveNav}
            artistThumbs={artistThumbs}
            setConfirmModal={setConfirmModal}
            showToast={showToast}
          />
        )}

        {activeNav === 'settings' && (
          <SettingsPanel
            initialTab={settingsTab}
            downloadQuality={downloadQuality}
            setDownloadQuality={setDownloadQuality}
            downloadPath={downloadPath}
            handleSelectDirectory={handleSelectDirectory}
            downloadFormat={downloadFormat}
            setDownloadFormat={setDownloadFormatState}
            embedThumbnail={embedThumbnail}
            setEmbedThumbnail={setEmbedThumbnailState}
            duplicateDetect={duplicateDetect}
            setDuplicateDetect={setDuplicateDetectState}
            onBackup={handleBackup}
            onRestore={handleRestore}
            onReset={() => setConfirmModal({
              message: 'Reset all Veluna data? This cannot be undone.',
              onConfirm: () => { localStorage.clear(); window.location.reload(); }
            })}
            backupPath={backupPath}
            setBackupPath={setBackupPath}
            loudnormEnabled={loudnormEnabled}
            setLoudnormEnabled={setLoudnormEnabledState}
            skipSilence={skipSilence}
            setSkipSilence={setSkipSilenceState}
            theme={theme}
            setThemeState={setTheme}
            accentColor={accentColor}
            setAccentColorState={setAccentColor}
            customBgColor={customBgColor}
            setCustomBgColorState={setCustomBgColor}
            performanceMode={performanceMode}
            setPerformanceMode={setPerformanceMode}
            lyricsSource={lyricsSource}
            setLyricsSource={setLyricsSource}
            autoCheckUpdates={autoCheckUpdates}
            setAutoCheckUpdates={setAutoCheckUpdates}
            isCheckingUpdate={isCheckingUpdate}
            updateAvailable={updateAvailable}
            handleCheckUpdate={handleCheckUpdate}
            appVersion={appVersion}
            trayEnabled={trayEnabled}
            setTrayEnabled={setTrayEnabled}
            discordRpcEnabled={discordRpcEnabled}
            setDiscordRpcEnabled={setDiscordRpcEnabled}
            listenbrainzEnabled={listenbrainzEnabled}
            setListenbrainzEnabled={setListenbrainzEnabled}
            listenbrainzToken={listenbrainzToken}
            setListenbrainzToken={setListenbrainzToken}
            listenbrainzUsername={listenbrainzUsername}
            setListenbrainzUsername={setListenbrainzUsername}
            lastfmEnabled={lastfmEnabled}
            setLastfmEnabled={setLastfmEnabled}
            lastfmSessionKey={lastfmSessionKey}
            setLastfmSessionKey={setLastfmSessionKey}
            lastfmApiKey={lastfmApiKey}
            setLastfmApiKey={setLastfmApiKey}
            lastfmApiSecret={lastfmApiSecret}
            setLastfmApiSecret={setLastfmApiSecret}
            lastfmUsername={lastfmUsername}
            setLastfmUsername={setLastfmUsername}
            autoplayEnabled={autoplayEnabled}
            setAutoplayEnabled={setAutoplayEnabled}
            eq={eq}
            setEq={setEqState}
            startupNav={startupNav}
            setStartupNav={setStartupNav}
            cacheEnabled={cacheEnabled}
            setCacheEnabled={setCacheEnabled}
            uiScale={uiScale}
            setUiScale={setUiScale}
            showToast={showToast}
          />
        )}
      </div>

      {/* 3. Slide-out Queue Panel */}
      <QueuePanel
        isQueueOpen={isQueueOpen}
        setIsQueueOpen={setIsQueueOpen}
        queue={queue}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isLoadingTrack={isLoadingTrack}
        loadingTrackUrl={loadingTrackUrl}
        showClearConfirm={showClearConfirm}
        setShowClearConfirm={setShowClearConfirm}
        playlistContextRef={playlistContextRef}
        handlePlayTrack={handlePlayTrack}
        clearQueue={clearQueue}
        removeFromQueue={removeFromQueue}
        moveQueueItem={moveQueueItem}
        openCtx={openCtx}
        setPlaylists={setPlaylists}
        showToast={showToast}
        dragQueueIdx={dragQueueIdx}
        dragOverQueueIdx={dragOverQueueIdx}
        setDragOverQueueIdx={setDragOverQueueIdx}
        dragOverQueueIdxRef={dragOverQueueIdxRef}
      />
      </div>

      {/* 4. Bottom Player Bar */}
      <PlayerBar
        currentTrack={currentTrack}
        getTrackCover={getTrackCover}
        isPlaying={isPlaying}
        isLoadingTrack={isLoadingTrack}
        loadingTrackUrl={loadingTrackUrl}
        audioInfo={audioInfo}
        progressSeconds={progressSeconds}
        trackDurationSeconds={trackDurationSeconds}
        waveformData={waveformData}
        abLoop={abLoop}
        setAbLoop={setAbLoop}
        shuffle={shuffle}
        repeatMode={repeatMode}
        toggleShuffle={toggleShuffle}
        cycleRepeat={cycleRepeat}
        playbackSpeed={playbackSpeed}
        setPlaybackSpeed={setPlaybackSpeedState}
        crossfadeSeconds={crossfadeSeconds}
        sleepTimer={sleepTimer}
        showSleepPopover={showSleepPopover}
        setShowSleepPopover={setShowSleepPopover}
        setSleepTimerMinutes={setSleepTimerMinutes}
        cancelSleepTimer={cancelSleepTimer}
        showLyrics={showLyrics}
        setShowLyrics={setShowLyrics}
        volume={volume}
        setVolume={setVolume}
        togglePlayPause={togglePlayPause}
        toggleMute={toggleMute}
        handleSkipForward={handleSkipForward}
        handleSkipBack={handleSkipBack}
        handleDownload={handleDownload}
        downloadingTracks={downloadingTracks}
        isTrackLiked={isTrackLiked}
        toggleLikeTrack={toggleLikeTrack}
        openCtx={openCtx}
        setInfoModalTrack={setInfoModalTrack}
        progressRef={progressRef}
        volumeRef={volumeRef}
        isDraggingProgress={isDraggingProgress}
        setIsDraggingProgress={setIsDraggingProgress}
        isDraggingProgressRef={isDraggingProgressRef}
        isDraggingVolume={isDraggingVolume}
        setIsDraggingVolume={setIsDraggingVolume}
        updateProgressFromEvent={updateProgressFromEvent}
        updateVolumeFromEvent={updateVolumeFromEvent}
        calculateProgressPercent={calculateProgressPercent}
        queue={queue}
        playlistContextRef={playlistContextRef}
        progressSecondsRef={progressSecondsRef}
        abLoopRef={abLoopRef}
        trackDurationRef={trackDurationRef}
        showToast={showToast}
      />

      {/* 5. Context Menu & Shared Modals */}
      <ContextMenu
        ctxMenu={ctxMenu}
        setCtxMenu={setCtxMenu}
        playlists={playlists}
        setPlaylists={setPlaylists}
        setQueue={setQueue}
        playNext={playNext}
        addToQueue={addToQueue}
        handlePlayTrack={handlePlayTrack}
        handlePlayLocalTrack={handlePlayLocalTrack}
        handleDownload={handleDownload}
        handleCancelDownload={handleCancelDownload}
        handleDeleteLocalTrack={handleDeleteLocalTrack}
        handleOpenInFileManager={handleOpenInFileManager}
        handleExportPlaylistM3u={handleExportPlaylistM3u}
        downloadingTracks={downloadingTracks}
        isTrackLiked={isTrackLiked}
        toggleLikeTrack={toggleLikeTrack}
        setRenamingPlaylist={setRenamingPlaylist}
        setRenameVal={setRenameVal}
        setRenameDescVal={setRenameDescVal}
        setPlaylistDeleteModal={setPlaylistDeleteModal}
        setShowDuplicatesPlaylist={setShowDuplicatesPlaylist}
        setBulkEditPlaylist={setBulkEditPlaylist}
        handlePlaylistCoverUpload={handlePlaylistCoverUpload}
        setInfoModalTrack={setInfoModalTrack}
        infoModalTrack={infoModalTrack}
        addToPlaylistTrack={addToPlaylistTrack}
        setAddToPlaylistTrack={setAddToPlaylistTrack}
        setMetadataEditingTrack={setMetadataEditingTrack}
        showToast={showToast}
      />

      {/* 6. Fullscreen Lyrics View */}
      <LyricsView
        showLyrics={showLyrics}
        setShowLyrics={setShowLyrics}
        currentTrack={currentTrack}
        getTrackCover={getTrackCover}
        progressSeconds={progressSeconds}
        trackDurationSeconds={trackDurationSeconds}
        shuffle={shuffle}
        toggleShuffle={toggleShuffle}
        handleSkipBack={handleSkipBack}
        togglePlayPause={togglePlayPause}
        isLoadingTrack={isLoadingTrack}
        isPlaying={isPlaying}
        handleSkipForward={handleSkipForward}
        repeatMode={repeatMode}
        cycleRepeat={cycleRepeat}
        volume={volume}
        setVolume={setVolume}
        toggleMute={toggleMute}
        lyricsLoading={lyricsLoading}
        lyricsData={lyricsData}
        lyricsScrollContainerRef={lyricsScrollContainerRef}
      />

      {/* 7. Dialogs and Overlays */}
      {/* Create Playlist Modal */}
      {isPlaylistModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 16px 100px 16px',
            background: 'rgba(var(--v-bg0-rgb), 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={() => setIsPlaylistModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--v-bg2)',
              border: '1px solid var(--v-bdr2)',
              borderRadius: '20px',
              padding: '22px 20px 18px',
              width: '340px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--v-fg)', margin: 0, letterSpacing: '-0.01em' }}>Create Playlist</h3>
              <button
                onClick={() => setIsPlaylistModalOpen(false)}
                style={{
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'var(--v-bg3)',
                  border: '1px solid var(--v-bdr2)',
                  cursor: 'pointer',
                  color: 'var(--v-fg2)',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--v-fg)'; e.currentTarget.style.borderColor = 'var(--v-bdr3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--v-fg2)'; e.currentTarget.style.borderColor = 'var(--v-bdr2)'; }}
              >
                <X size={11} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              <div>
                <label style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--v-fg3)', display: 'block', marginBottom: '6px' }}>Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  placeholder="e.g. Cyberpunk Mix"
                  style={{
                    width: '100%',
                    background: 'var(--v-bg3)',
                    border: '1px solid var(--v-bdr2)',
                    color: 'var(--v-fg)',
                    borderRadius: '10px',
                    padding: '9px 14px',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--v-accent)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--v-bdr2)'; }}
                  onKeyDown={e => e.key === 'Enter' && confirmCreatePlaylist()}
                />
              </div>
              <div>
                <label style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--v-fg3)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                  <AlignLeft size={9} /> Description <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--v-fg4)' }}>optional</span>
                </label>
                <textarea
                  value={newPlaylistDesc}
                  onChange={e => setNewPlaylistDesc(e.target.value)}
                  placeholder="What's this playlist about?"
                  rows={2}
                  style={{
                    width: '100%',
                    background: 'var(--v-bg3)',
                    border: '1px solid var(--v-bdr2)',
                    color: 'var(--v-fg)',
                    borderRadius: '10px',
                    padding: '9px 14px',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--v-accent)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--v-bdr2)'; }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setIsPlaylistModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: '1px solid var(--v-bdr2)',
                  color: 'var(--v-fg2)',
                  background: 'var(--v-bg3)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--v-fg)'; e.currentTarget.style.borderColor = 'var(--v-bdr3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--v-fg2)'; e.currentTarget.style.borderColor = 'var(--v-bdr2)'; }}
              >
                Cancel
              </button>
              <button
                onClick={confirmCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: 'var(--v-accent)',
                  color: 'var(--v-bg0)',
                  fontWeight: 700,
                  cursor: newPlaylistName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                  opacity: newPlaylistName.trim() ? 1 : 0.4,
                  transition: 'opacity .15s',
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Playlist Modal */}
      {renamingPlaylist && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 16px 100px 16px',
            background: 'rgba(var(--v-bg0-rgb), 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={() => setRenamingPlaylist(null)}
        >
          <div
            style={{
              background: 'var(--v-bg2)',
              border: '1px solid var(--v-bdr2)',
              borderRadius: '20px',
              padding: '22px 20px 18px',
              width: '340px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--v-fg)', margin: 0, letterSpacing: '-0.01em' }}>Edit Playlist</h3>
              <button
                onClick={() => setRenamingPlaylist(null)}
                style={{
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'var(--v-bg3)',
                  border: '1px solid var(--v-bdr2)',
                  cursor: 'pointer',
                  color: 'var(--v-fg2)',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--v-fg)'; e.currentTarget.style.borderColor = 'var(--v-bdr3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--v-fg2)'; e.currentTarget.style.borderColor = 'var(--v-bdr2)'; }}
              >
                <X size={11} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              <div>
                <label style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--v-fg3)', display: 'block', marginBottom: '6px' }}>Name</label>
                <input
                  autoFocus
                  type="text"
                  value={renameVal}
                  onChange={e => setRenameVal(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--v-bg3)',
                    border: '1px solid var(--v-bdr2)',
                    color: 'var(--v-fg)',
                    borderRadius: '10px',
                    padding: '9px 14px',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--v-accent)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--v-bdr2)'; }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') confirmRenamePlaylist();
                    if (e.key === 'Escape') setRenamingPlaylist(null);
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--v-fg3)', display: 'block', marginBottom: '6px' }}>
                  Description <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--v-fg4)' }}>optional</span>
                </label>
                <textarea
                  value={renameDescVal}
                  onChange={e => setRenameDescVal(e.target.value)}
                  rows={2}
                  placeholder="e.g. Chill vibes, road trip..."
                  style={{
                    width: '100%',
                    background: 'var(--v-bg3)',
                    border: '1px solid var(--v-bdr2)',
                    color: 'var(--v-fg)',
                    borderRadius: '10px',
                    padding: '9px 14px',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--v-accent)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--v-bdr2)'; }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setRenamingPlaylist(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: '1px solid var(--v-bdr2)',
                  color: 'var(--v-fg2)',
                  background: 'var(--v-bg3)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--v-fg)'; e.currentTarget.style.borderColor = 'var(--v-bdr3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--v-fg2)'; e.currentTarget.style.borderColor = 'var(--v-bdr2)'; }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRenamePlaylist}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: 'var(--v-accent)',
                  color: 'var(--v-bg0)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(var(--v-bg0-rgb),0.88)' }}
          onClick={() => setShowShortcuts(false)}
        >
          <div
            style={{ background: 'var(--v-bg2)', border: '1px solid var(--v-bdr2)', borderRadius: '14px', width: '500px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.85)' }}
            className="custom-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--v-bdr2)' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--v-fg)', margin: 0 }}>Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcuts(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v-fg3)', display: 'flex', padding: '3px', borderRadius: '5px' }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '24px', rowGap: '4px' }}>
              {([
                ['Playback', null],
                ['Space', 'Play / Pause'],
                ['←', 'Seek back 10s'],
                ['→', 'Seek forward 10s'],
                ['M', 'Mute / Unmute'],
                ['Navigation', null],
                ['Ctrl+1', 'Home View'],
                ['Ctrl+2', 'Offline Library'],
                ['Ctrl+3', 'Listening Stats'],
                ['Ctrl+4', 'Settings Panel'],
                ['Ctrl+5', 'Toggle Play Queue'],
                ['Ctrl+P', 'Playlists Menu'],
                ['Shift+1..9', 'Open Playlist 1..9'],
                ['Ctrl+F', 'Focus Search'],
                ['?', 'Show this overlay'],
                ['Esc', 'Close any overlay'],
              ] as [string, string | null][]).map(([key, action], i) =>
                action === null ? (
                  <div key={i} style={{ gridColumn: '1/-1', marginTop: '10px', marginBottom: '4px', fontSize: '9.5px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--v-fg3)' }}>
                    {key}
                  </div>
                ) : (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--v-bdr2)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--v-fg2)' }}>{action}</span>
                    <kbd style={{ padding: '2px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, background: 'var(--v-bg3)', border: '1px solid var(--v-bdr2)', color: 'var(--v-fg)', marginLeft: '12px', flexShrink: 0, fontFamily: 'monospace' }}>
                      {key}
                    </kbd>
                  </div>
                )
              )}
            </div>
            <div style={{ padding: '10px 18px', borderTop: '1px solid var(--v-bdr2)', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: 'var(--v-fg3)' }}>
                Press <kbd style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9.5px', background: 'var(--v-bg3)', border: '1px solid var(--v-bdr2)', color: 'var(--v-fg)', fontFamily: 'monospace' }}>?</kbd> or <kbd style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9.5px', background: 'var(--v-bg3)', border: '1px solid var(--v-bdr2)', color: 'var(--v-fg)', fontFamily: 'monospace' }}>Esc</kbd> to close
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(var(--v-bg0-rgb),0.88)' }}
          onClick={() => setConfirmModal(null)}
        >
          <div
            style={{ background: 'var(--v-bg2)', border: '1px solid var(--v-bdr2)', borderRadius: '12px', width: '320px', boxShadow: '0 24px 60px rgba(0,0,0,0.85)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--v-bdr2)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--v-fg)', margin: 0 }}>Confirm</h3>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <p style={{ fontSize: '13px', color: 'var(--v-fg2)', lineHeight: 1.5, margin: 0 }}>{confirmModal.message}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '10px 18px', borderTop: '1px solid var(--v-bdr2)' }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--v-bdr2)', color: 'var(--v-fg2)', background: 'var(--v-bg3)', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
                style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Delete Modal */}
      {playlistDeleteModal && (
        <PlaylistDeleteConfirmModal
          isOpen={!!playlistDeleteModal}
          modalData={playlistDeleteModal}
          onClose={() => setPlaylistDeleteModal(null)}
          onConfirmDelete={confirmDeletePlaylist}
        />
      )}

      {/* Metadata Edit Modal */}
      {metadataEditingTrack && (
        <MetadataEditModal
          track={metadataEditingTrack}
          onSave={handleSaveMetadata}
          onClose={() => setMetadataEditingTrack(null)}
        />
      )}

      {/* YouTube Import Modal */}
      {(showYtImportModal || bgYtImport) && (
        <YtImportModal
          visible={showYtImportModal}
          onClose={() => setShowYtImportModal(false)}
          onProgress={progress => setBgYtImport(progress !== null ? { progress } : null)}
          onAbort={() => {
            setBgYtImport(null);
            setShowYtImportModal(false);
            showToast('YouTube import cancelled');
          }}
          onSavePlaylist={(name, desc, importedTracks) => {
            const id = `yt_${Date.now()}`;
            setPlaylists(prev => [...prev, { id, name, description: desc || 'Imported from YouTube', tracks: importedTracks }]);
            showToast(`"${name}" saved — ${importedTracks.length} tracks`);
            setBgYtImport(null);
          }}
          showToast={showToast}
        />
      )}

      {/* Spotify CSV Import Modal */}
      {(showCsvImportModal || bgImport) && (
        <CsvImportModal
          visible={showCsvImportModal}
          onClose={() => setShowCsvImportModal(false)}
          onAbort={() => {
            setBgImport(null);
            setShowCsvImportModal(false);
            showToast('Spotify import cancelled');
          }}
          onSavePlaylist={(name, desc, importedTracks) => {
            const id = `csv_${Date.now()}`;
            setPlaylists(prev => [...prev, { id, name, description: desc || 'Imported from Spotify', tracks: importedTracks }]);
            showToast(`"${name}" saved — ${importedTracks.length} tracks`);
            setBgImport(null);
            setPendingSpotifyImport(null);
          }}
          onMatchingDone={(importedTracks, matched, failed) => {
            setPendingSpotifyImport({ tracks: importedTracks, matchedCount: matched, failedCount: failed });
            setShowCsvImportModal(false);
          }}
          showToast={showToast}
          onProgress={(matched, total, label) => setBgImport(total > 0 ? { matched, total, label } : null)}
        />
      )}

      {/* Import Result Modal */}
      {pendingSpotifyImport && !showCsvImportModal && (
        <ImportResultModal
          matchedCount={pendingSpotifyImport.matchedCount}
          failedCount={pendingSpotifyImport.failedCount}
          onSave={(name, desc) => {
            const id = `csv_${Date.now()}`;
            setPlaylists(prev => [...prev, { id, name, description: desc || 'Imported from Spotify', tracks: pendingSpotifyImport.tracks }]);
            showToast(`"${name}" saved — ${pendingSpotifyImport.tracks.length} tracks`);
            setBgImport(null);
            setPendingSpotifyImport(null);
          }}
          onClose={() => {
            setPendingSpotifyImport(null);
            setBgImport(null);
          }}
        />
      )}

      {/* Duplicate Finder Modal */}
      {showDuplicatesPlaylist && (() => {
        const seenUrls = new Set<string>();
        const seenTrackKeys = new Set<string>();
        const duplicatesWithIndex: { track: Track; originalIndex: number }[] = [];

        showDuplicatesPlaylist.tracks.forEach((t, index) => {
          const normKey = `${cleanArtist(t.artist).toLowerCase()}|||${t.title.toLowerCase().trim()}`;
          const hasUrl = Boolean(t.url && t.url.trim() !== '');
          const isUrlDupe = hasUrl && seenUrls.has(t.url);
          const isTitleDupe = seenTrackKeys.has(normKey);

          if (isUrlDupe || isTitleDupe) {
            duplicatesWithIndex.push({ track: t, originalIndex: index });
          } else {
            if (hasUrl) seenUrls.add(t.url);
            seenTrackKeys.add(normKey);
          }
        });

        const handleRemoveSingle = (indexToRemove: number) => {
          setPlaylists(prev => prev.map(p => {
            if (p.id !== showDuplicatesPlaylist.id) return p;
            return {
              ...p,
              tracks: p.tracks.filter((_, idx) => idx !== indexToRemove)
            };
          }));
          setShowDuplicatesPlaylist(prev => {
            if (!prev) return null;
            return {
              ...prev,
              tracks: prev.tracks.filter((_, idx) => idx !== indexToRemove)
            };
          });
          showToast('Duplicate track removed');
        };

        const handleRemoveAll = () => {
          const dupeIndices = new Set(duplicatesWithIndex.map(d => d.originalIndex));
          const cleanedTracks = showDuplicatesPlaylist.tracks.filter((_, idx) => !dupeIndices.has(idx));
          const removedCount = duplicatesWithIndex.length;

          setPlaylists(prev => prev.map(p => {
            if (p.id !== showDuplicatesPlaylist.id) return p;
            return { ...p, tracks: cleanedTracks };
          }));
          setShowDuplicatesPlaylist(prev => prev ? { ...prev, tracks: cleanedTracks } : null);
          showToast(`Removed ${removedCount} duplicate track${removedCount > 1 ? 's' : ''}`);
        };

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 16px 100px 16px',
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
            onClick={() => setShowDuplicatesPlaylist(null)}
          >
            <div
              style={{
                background: 'var(--v-bg2)',
                border: '1px solid var(--v-bdr2)',
                borderRadius: '18px',
                width: '100%',
                maxWidth: '520px',
                maxHeight: 'calc(100vh - 130px)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 32px 80px rgba(0,0,0,0.85)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--v-bdr2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--v-fg)', margin: 0, letterSpacing: '-0.01em' }}>Duplicate Finder</h3>
                  <p style={{ fontSize: '11.5px', color: 'var(--v-fg3)', margin: '3px 0 0' }}>Playlist: <span style={{ color: 'var(--v-fg2)', fontWeight: 600 }}>{showDuplicatesPlaylist.name}</span></p>
                </div>
                <button
                  onClick={() => setShowDuplicatesPlaylist(null)}
                  style={{
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: 'var(--v-bg3)',
                    border: '1px solid var(--v-bdr)',
                    cursor: 'pointer',
                    color: 'var(--v-fg3)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--v-fg)';
                    e.currentTarget.style.borderColor = 'var(--v-bdr2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--v-fg3)';
                    e.currentTarget.style.borderColor = 'var(--v-bdr)';
                  }}
                >
                  <X size={13} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }} className="custom-scrollbar">
                {duplicatesWithIndex.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 0', gap: '8px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--v-bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                      <CheckCircle size={24} style={{ color: 'var(--v-accent)' }} />
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--v-fg)', margin: 0 }}>No duplicates found</p>
                    <p style={{ fontSize: '12px', color: 'var(--v-fg3)', margin: 0 }}>All tracks in this playlist are unique.</p>
                    <button
                      onClick={() => setShowDuplicatesPlaylist(null)}
                      style={{
                        marginTop: '12px',
                        padding: '7px 20px',
                        borderRadius: '9999px',
                        background: 'var(--v-bg3)',
                        border: '1px solid var(--v-bdr2)',
                        color: 'var(--v-fg)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--v-fg3)', fontWeight: 600 }}>
                        {duplicatesWithIndex.length} duplicate track{duplicatesWithIndex.length > 1 ? 's' : ''} found
                      </span>
                      {duplicatesWithIndex.length > 1 && (
                        <button
                          onClick={handleRemoveAll}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: 'var(--v-accent)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            transition: 'opacity 0.15s ease'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                          <Trash2 size={12} /> Remove All ({duplicatesWithIndex.length})
                        </button>
                      )}
                    </div>

                    {duplicatesWithIndex.map(({ track: t, originalIndex }) => (
                      <div
                        key={originalIndex}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          background: 'var(--v-bg3)',
                          border: '1px solid var(--v-bdr)',
                          transition: 'border-color 0.15s ease'
                        }}
                      >
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '1px solid var(--v-bdr2)',
                            position: 'relative',
                            background: getTrackGradient(t.title, t.artist),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Music size={14} style={{ position: 'absolute', color: 'rgba(255,255,255,0.25)' }} />
                          {getTrackCover(t) && (
                            <img
                              src={getTrackCover(t)}
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => { e.currentTarget.style.display = 'none'; }}
                              alt=""
                            />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--v-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.title}
                          </div>
                          {t.artist && (
                            <div style={{ fontSize: '11.5px', color: 'var(--v-fg3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                              {t.artist}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemoveSingle(originalIndex)}
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '6px 14px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.22)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.45)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.22)';
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bulk Tag Editor Modal */}
      {bulkEditPlaylist && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 16px 100px 16px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'var(--v-bg2)', border: '1px solid var(--v-bdr2)', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.85)' }}>
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--v-bdr2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--v-fg)', margin: 0, letterSpacing: '-0.01em' }}>Bulk Tag Editor</h3>
                <p style={{ fontSize: '11px', color: 'var(--v-fg3)', margin: '3px 0 0' }}>{bulkEditPlaylist.tracks.length} tracks in <span style={{ color: 'var(--v-fg2)', fontWeight: 600 }}>{bulkEditPlaylist.name}</span></p>
              </div>
              <button
                onClick={() => setBulkEditPlaylist(null)}
                style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--v-bg3)', border: '1px solid var(--v-bdr)', cursor: 'pointer', color: 'var(--v-fg3)', transition: 'all 0.15s ease' }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--v-fg)';
                  e.currentTarget.style.borderColor = 'var(--v-bdr2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--v-fg3)';
                  e.currentTarget.style.borderColor = 'var(--v-bdr)';
                }}
              >
                <X size={12} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }} className="custom-scrollbar">
              <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', padding: '6px 8px', marginBottom: '2px' }}>
                <span style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--v-fg3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>#</span>
                <span style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--v-fg3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Title</span>
                <span style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--v-fg3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Artist</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {bulkEditPlaylist.tracks.map((t, i) => (
                  <div key={t.url} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', alignItems: 'center', padding: '4px 8px', borderRadius: '10px', background: 'var(--v-bg3)', border: '1px solid var(--v-bdr)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--v-fg3)', fontVariantNumeric: 'tabular-nums', paddingLeft: '4px' }}>{i + 1}</span>
                    <input
                      defaultValue={t.title}
                      onBlur={e => {
                        const newTitle = e.target.value.trim();
                        if (newTitle && newTitle !== t.title) {
                          setPlaylists(prev => prev.map(p => p.id === bulkEditPlaylist.id
                            ? { ...p, tracks: p.tracks.map(x => x.url === t.url ? { ...x, title: newTitle } : x) }
                            : p));
                          setBulkEditPlaylist(prev => prev ? { ...prev, tracks: prev.tracks.map(x => x.url === t.url ? { ...x, title: newTitle } : x) } : null);
                        }
                      }}
                      style={{ width: '100%', background: 'transparent', color: 'var(--v-fg)', fontSize: '12.5px', fontWeight: 500, padding: '5px 8px', borderRadius: '7px', border: '1px solid transparent', outline: 'none' }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'var(--v-accent)';
                        e.currentTarget.style.background = 'var(--v-bg2)';
                      }}
                      onBlurCapture={e => {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    />
                    <input
                      defaultValue={t.artist}
                      onBlur={e => {
                        const newArtist = e.target.value.trim();
                        if (newArtist !== t.artist) {
                          setPlaylists(prev => prev.map(p => p.id === bulkEditPlaylist.id
                            ? { ...p, tracks: p.tracks.map(x => x.url === t.url ? { ...x, artist: newArtist } : x) }
                            : p));
                          setBulkEditPlaylist(prev => prev ? { ...prev, tracks: prev.tracks.map(x => x.url === t.url ? { ...x, artist: newArtist } : x) } : null);
                        }
                      }}
                      style={{ width: '100%', background: 'transparent', color: 'var(--v-fg2)', fontSize: '12px', padding: '5px 8px', borderRadius: '7px', border: '1px solid transparent', outline: 'none' }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'var(--v-accent)';
                        e.currentTarget.style.background = 'var(--v-bg2)';
                      }}
                      onBlurCapture={e => {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--v-bdr2)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button
                onClick={() => { showToast('Tags saved'); setBulkEditPlaylist(null); }}
                style={{ padding: '9px 22px', background: 'var(--v-accent)', color: '#000000', fontWeight: 700, borderRadius: '9999px', border: 'none', cursor: 'pointer', fontSize: '12.5px', transition: 'all 0.15s ease' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                Save &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Spotify Background Import Pill */}
      {bgImport && !showCsvImportModal && !pendingSpotifyImport && (
        <div
          onClick={() => setShowCsvImportModal(true)}
          style={{
            position: 'fixed', bottom: '84px', right: '16px', zIndex: 9998, display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(29, 185, 84, 0.15)', background: 'rgba(22, 20, 20, 0.95)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.7)', cursor: 'pointer'
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1db954">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '150px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#e2ddd9' }}>Importing Spotify...</span>
              <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#8a807c', fontVariantNumeric: 'tabular-nums' }}>{bgImport.matched}/{bgImport.total}</span>
            </div>
            <div style={{ height: '3px', borderRadius: '1.5px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '1.5px', background: 'linear-gradient(90deg, #1db954 0%, #1ed760 100%)', width: `${(bgImport.matched / bgImport.total) * 100}%` }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowCsvImportModal(true)} style={{ color: '#8a807c', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Maximize2 size={11} />
            </button>
            <button onClick={() => { setBgImport(null); setShowCsvImportModal(false); showToast('Spotify import cancelled'); }} style={{ color: '#8a807c', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Floating YouTube Background Import Pill */}
      {bgYtImport && !showYtImportModal && (
        <div
          onClick={() => setShowYtImportModal(true)}
          style={{
            position: 'fixed', bottom: bgImport ? '156px' : '84px', right: '16px', zIndex: 9998, display: 'flex', alignItems: 'center',
            gap: '12px', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 30, 39, 0.15)', background: 'rgba(22, 20, 20, 0.95)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.7)', cursor: 'pointer'
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff1e27">
              <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.388.507 9.388.507s7.517 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '150px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#e2ddd9' }}>Importing YouTube...</span>
              <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#ff1e27', fontVariantNumeric: 'tabular-nums' }}>{Math.round(bgYtImport.progress)}%</span>
            </div>
            <div style={{ height: '3px', borderRadius: '1.5px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '1.5px', background: 'linear-gradient(90deg, #ff1e27 0%, #ff4b55 100%)', width: `${bgYtImport.progress}%` }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowYtImportModal(true)} style={{ color: '#8a807c', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Maximize2 size={11} />
            </button>
            <button onClick={() => { setBgYtImport(null); setShowYtImportModal(false); showToast('YouTube import cancelled'); }} style={{ color: '#8a807c', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '96px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: '#181615',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: 600,
          padding: '9px 18px',
          borderRadius: '9999px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.85), 0 2px 8px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
          animation: 'toastIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          letterSpacing: '-0.01em',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
