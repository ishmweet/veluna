import { Track } from '../types';
import { md5 } from '../utils/md5';
import { cleanArtist } from '../utils';

export const DEFAULT_LASTFM_API_KEY = 'c102df081c7ff910f5451965eef83151';
export const DEFAULT_LASTFM_API_SECRET = '631b1c67e91404c0bc064c5145b23d9b';

export interface ScrobbleResult {
  success: boolean;
  error?: string;
}

export function sanitizeTrackInfo(track: Track): { artist: string; title: string } {
  let rawTitle = (track.title || '').trim();
  let rawArtist = cleanArtist(track.artist || '');

  if (!rawArtist && rawTitle.includes(' - ')) {
    const parts = rawTitle.split(' - ');
    if (parts.length >= 2) {
      rawArtist = parts[0].trim();
      rawTitle = parts.slice(1).join(' - ').trim();
    }
  }

  const cleanedTitle = rawTitle
    .replace(/\s*[\(\[](?:official\s*(?:video|audio|music\s*video|lyric\s*video|visualizer|hd|4k)?|music\s*video|lyric\s*video|lyrics|audio|visualizer|remastered|explicit|hd|4k)[\)\]]/gi, '')
    .replace(/\s*ft\.?\s+.*$/i, '')
    .trim();

  return {
    artist: rawArtist || 'Unknown Artist',
    title: cleanedTitle || rawTitle || 'Unknown Track',
  };
}

export async function validateListenBrainzToken(token: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  const trimmed = token.trim();
  if (!trimmed) return { valid: false, error: 'User Token cannot be empty' };

  try {
    const res = await fetch('https://api.listenbrainz.org/1/validate-token', {
      headers: {
        'Authorization': `Token ${trimmed}`,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { valid: false, error: data.error || data.message || `HTTP ${res.status}: Unauthorized` };
    }

    if (data.valid) {
      return { valid: true, username: data.user_name };
    }
    return { valid: false, error: data.message || 'Invalid ListenBrainz Token' };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Network error connecting to ListenBrainz' };
  }
}

export async function submitListenBrainzNowPlaying(
  token: string,
  track: Track,
  durationSec: number
): Promise<ScrobbleResult> {
  const trimmed = token.trim();
  if (!trimmed) return { success: false, error: 'ListenBrainz User Token is missing' };

  const { artist, title } = sanitizeTrackInfo(track);
  if (!artist || !title || artist === 'Unknown Artist') {
    return { success: false, error: 'Missing valid artist or track title' };
  }

  const payload = {
    listen_type: 'playing_now',
    payload: [
      {
        track_metadata: {
          artist_name: artist,
          track_name: title,
          additional_info: {
            media_player: 'Veluna',
            submission_client: 'Veluna',
            duration_ms: Math.round((durationSec || 0) * 1000),
          },
        },
      },
    ],
  };

  try {
    const res = await fetch('https://api.listenbrainz.org/1/submit-listens', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${trimmed}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || data.message || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function submitListenBrainzScrobble(
  token: string,
  track: Track,
  durationSec: number,
  listenedAtUnixSec?: number
): Promise<ScrobbleResult> {
  const trimmed = token.trim();
  if (!trimmed) return { success: false, error: 'ListenBrainz User Token is missing' };

  const { artist, title } = sanitizeTrackInfo(track);
  if (!artist || !title || artist === 'Unknown Artist') {
    return { success: false, error: 'Missing valid artist or track title' };
  }

  const timestamp = listenedAtUnixSec || Math.floor(Date.now() / 1000);

  const payload = {
    listen_type: 'single',
    payload: [
      {
        listened_at: timestamp,
        track_metadata: {
          artist_name: artist,
          track_name: title,
          additional_info: {
            media_player: 'Veluna',
            submission_client: 'Veluna',
            duration_ms: Math.round((durationSec || 0) * 1000),
          },
        },
      },
    ],
  };

  try {
    const res = await fetch('https://api.listenbrainz.org/1/submit-listens', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${trimmed}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || data.message || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

function signLastFmParams(params: Record<string, string>, apiSecret: string): string {
  const keys = Object.keys(params).sort();
  let sigString = '';
  for (const k of keys) {
    if (k === 'format' || k === 'callback' || k === 'api_sig') continue;
    sigString += `${k}${params[k]}`;
  }
  sigString += apiSecret;
  return md5(sigString);
}

export async function validateLastFmSession(
  sessionKey: string,
  apiKey: string = DEFAULT_LASTFM_API_KEY,
  apiSecret: string = DEFAULT_LASTFM_API_SECRET
): Promise<{ valid: boolean; username?: string; error?: string }> {
  const sk = sessionKey.trim();
  const key = (apiKey || DEFAULT_LASTFM_API_KEY).trim();
  const secret = (apiSecret || DEFAULT_LASTFM_API_SECRET).trim();

  if (!sk) return { valid: false, error: 'Session Key cannot be empty' };
  if (!key || !secret) return { valid: false, error: 'API Key and Secret are required' };

  const params: Record<string, string> = {
    method: 'user.getInfo',
    api_key: key,
    sk,
  };
  params.api_sig = signLastFmParams(params, secret);
  params.format = 'json';

  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${query}`);
    const data = await res.json();

    if (data.error) {
      return { valid: false, error: data.message || `Last.fm error code ${data.error}` };
    }

    if (data.user?.name) {
      return { valid: true, username: data.user.name };
    }
    return { valid: false, error: 'Invalid Last.fm session' };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Network error connecting to Last.fm' };
  }
}

export async function submitLastFmNowPlaying(
  sessionKey: string,
  track: Track,
  durationSec: number,
  apiKey: string = DEFAULT_LASTFM_API_KEY,
  apiSecret: string = DEFAULT_LASTFM_API_SECRET
): Promise<ScrobbleResult> {
  const sk = sessionKey.trim();
  const key = (apiKey || DEFAULT_LASTFM_API_KEY).trim();
  const secret = (apiSecret || DEFAULT_LASTFM_API_SECRET).trim();

  if (!sk || !key || !secret) return { success: false, error: 'Missing Last.fm credentials' };

  const { artist, title } = sanitizeTrackInfo(track);
  if (!artist || !title || artist === 'Unknown Artist') {
    return { success: false, error: 'Missing valid artist or track title' };
  }

  const params: Record<string, string> = {
    method: 'track.updateNowPlaying',
    api_key: key,
    sk,
    artist,
    track: title,
  };

  if (durationSec > 0) {
    params.duration = Math.round(durationSec).toString();
  }

  params.api_sig = signLastFmParams(params, secret);
  params.format = 'json';

  try {
    const res = await fetch('https://ws.audioscrobbler.com/2.0/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params).toString(),
    });

    const data = await res.json().catch(() => ({}));
    if (data.error) {
      return { success: false, error: data.message || `Last.fm error code ${data.error}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function submitLastFmScrobble(
  sessionKey: string,
  track: Track,
  durationSec: number,
  timestampUnixSec?: number,
  apiKey: string = DEFAULT_LASTFM_API_KEY,
  apiSecret: string = DEFAULT_LASTFM_API_SECRET
): Promise<ScrobbleResult> {
  const sk = sessionKey.trim();
  const key = (apiKey || DEFAULT_LASTFM_API_KEY).trim();
  const secret = (apiSecret || DEFAULT_LASTFM_API_SECRET).trim();

  if (!sk || !key || !secret) return { success: false, error: 'Missing Last.fm credentials' };

  const { artist, title } = sanitizeTrackInfo(track);
  if (!artist || !title || artist === 'Unknown Artist') {
    return { success: false, error: 'Missing valid artist or track title' };
  }

  const timestamp = timestampUnixSec || Math.floor(Date.now() / 1000);

  const params: Record<string, string> = {
    method: 'track.scrobble',
    api_key: key,
    sk,
    artist,
    track: title,
    timestamp: timestamp.toString(),
  };

  if (durationSec > 0) {
    params.duration = Math.round(durationSec).toString();
  }

  params.api_sig = signLastFmParams(params, secret);
  params.format = 'json';

  try {
    const res = await fetch('https://ws.audioscrobbler.com/2.0/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params).toString(),
    });

    const data = await res.json().catch(() => ({}));
    if (data.error) {
      return { success: false, error: data.message || `Last.fm error code ${data.error}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}
