export type Track = {
  id: number;
  title: string;
  artist: string;
  duration: string;
  url: string;
  cover: string;
  mediaType?: 'music' | 'video';
};

export type LocalTrack = {
  title: string;
  path: string;
  size_bytes: number;
  extension: string;
  artist?: string;
  duration?: string;
  has_cover?: boolean;
  cover?: string;
};

export type ListeningEvent = {
  url: string;
  playedAt: string;
  secs: number;
};

export type Playlist = {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  customCover?: string;
};

export type RepeatMode = 'off' | 'all' | 'one';

export type LyricLine = {
  time: number;
  text: string;
};

export type LyricsData = {
  lines: LyricLine[];
  title: string;
  artist: string;
};

export type CtxMenu = {
  x: number;
  y: number;
  type: 'track' | 'playlist' | 'sidebar-playlist' | 'queue-track' | 'quickpick' | 'local';
  track?: Track;
  playlist?: Playlist;
  localTracksList?: LocalTrack[];
  localTrackIndex?: number;
};

export type NavView = 'home' | 'downloads' | 'playlists' | 'library' | 'stats' | 'settings';

export type AudioInfo = { codec: string; bitrate: number; samplerate: number; channels: string; format: string; url: string };
export type DiskInfo = { used_bytes: number; track_count: number };
export type BatchProgress = { index: number; total: number; title: string; success: boolean; error?: string };
export type SettingsTab = 'updates' | 'downloads' | 'playback' | 'storage' | 'appearance' | 'integrations';
