import { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '../types';
import { loadLS, saveLS } from '../utils';
import {
  submitListenBrainzNowPlaying,
  submitListenBrainzScrobble,
  submitLastFmNowPlaying,
  submitLastFmScrobble,
  DEFAULT_LASTFM_API_KEY,
  DEFAULT_LASTFM_API_SECRET,
} from '../services/scrobbler';

interface UseScrobblerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  progressSeconds: number;
  trackDurationSeconds: number;
  showToast?: (msg: string) => void;
}

export function useScrobbler({
  currentTrack,
  isPlaying,
  progressSeconds,
  trackDurationSeconds,
  showToast,
}: UseScrobblerProps) {
  const [listenbrainzEnabled, setListenbrainzEnabledState] = useState<boolean>(() =>
    loadLS('vg_lb_enabled', false)
  );
  const [listenbrainzToken, setListenbrainzTokenState] = useState<string>(() =>
    loadLS('vg_lb_token', '')
  );
  const [listenbrainzUsername, setListenbrainzUsernameState] = useState<string>(() =>
    loadLS('vg_lb_username', '')
  );

  const [lastfmEnabled, setLastfmEnabledState] = useState<boolean>(() =>
    loadLS('vg_lfm_enabled', false)
  );
  const [lastfmSessionKey, setLastfmSessionKeyState] = useState<string>(() =>
    loadLS('vg_lfm_session', '')
  );
  const [lastfmApiKey, setLastfmApiKeyState] = useState<string>(() =>
    loadLS('vg_lfm_apikey', DEFAULT_LASTFM_API_KEY)
  );
  const [lastfmApiSecret, setLastfmApiSecretState] = useState<string>(() =>
    loadLS('vg_lfm_secret', DEFAULT_LASTFM_API_SECRET)
  );
  const [lastfmUsername, setLastfmUsernameState] = useState<string>(() =>
    loadLS('vg_lfm_username', '')
  );

  const setListenbrainzEnabled = useCallback((v: boolean) => {
    setListenbrainzEnabledState(v);
    saveLS('vg_lb_enabled', v);
  }, []);

  const setListenbrainzToken = useCallback((t: string) => {
    setListenbrainzTokenState(t);
    saveLS('vg_lb_token', t);
  }, []);

  const setListenbrainzUsername = useCallback((u: string) => {
    setListenbrainzUsernameState(u);
    saveLS('vg_lb_username', u);
  }, []);

  const setLastfmEnabled = useCallback((v: boolean) => {
    setLastfmEnabledState(v);
    saveLS('vg_lfm_enabled', v);
  }, []);

  const setLastfmSessionKey = useCallback((k: string) => {
    setLastfmSessionKeyState(k);
    saveLS('vg_lfm_session', k);
  }, []);

  const setLastfmApiKey = useCallback((k: string) => {
    setLastfmApiKeyState(k);
    saveLS('vg_lfm_apikey', k);
  }, []);

  const setLastfmApiSecret = useCallback((s: string) => {
    setLastfmApiSecretState(s);
    saveLS('vg_lfm_secret', s);
  }, []);

  const setLastfmUsername = useCallback((u: string) => {
    setLastfmUsernameState(u);
    saveLS('vg_lfm_username', u);
  }, []);

  const hasSentNowPlayingRef = useRef<boolean>(false);
  const hasScrobbledRef = useRef<boolean>(false);
  const currentTrackUrlRef = useRef<string | null>(null);
  const trackStartTimeRef = useRef<number>(Math.floor(Date.now() / 1000));
  const previousProgressRef = useRef<number>(0);

  useEffect(() => {
    const trackUrl = currentTrack?.url || null;
    if (trackUrl !== currentTrackUrlRef.current) {
      currentTrackUrlRef.current = trackUrl;
      hasSentNowPlayingRef.current = false;
      hasScrobbledRef.current = false;
      trackStartTimeRef.current = Math.floor(Date.now() / 1000);
      previousProgressRef.current = 0;
    }
  }, [currentTrack?.url]);

  useEffect(() => {
    if (previousProgressRef.current > 30 && progressSeconds < 3) {
      hasSentNowPlayingRef.current = false;
      hasScrobbledRef.current = false;
      trackStartTimeRef.current = Math.floor(Date.now() / 1000);
    }
    previousProgressRef.current = progressSeconds;
  }, [progressSeconds]);

  useEffect(() => {
    if (!isPlaying || !currentTrack || hasSentNowPlayingRef.current) return;
    if (!currentTrack.title) return;

    hasSentNowPlayingRef.current = true;
    const dur = trackDurationSeconds || 0;

    if (listenbrainzEnabled && listenbrainzToken.trim()) {
      submitListenBrainzNowPlaying(listenbrainzToken, currentTrack, dur).then(res => {
        if (!res.success && res.error) {
          console.warn('[ListenBrainz Now Playing Error]:', res.error);
        }
      });
    }

    if (lastfmEnabled && lastfmSessionKey.trim()) {
      submitLastFmNowPlaying(lastfmSessionKey, currentTrack, dur, lastfmApiKey, lastfmApiSecret).then(res => {
        if (!res.success && res.error) {
          console.warn('[Last.fm Now Playing Error]:', res.error);
        }
      });
    }
  }, [
    isPlaying,
    currentTrack,
    trackDurationSeconds,
    listenbrainzEnabled,
    listenbrainzToken,
    lastfmEnabled,
    lastfmSessionKey,
    lastfmApiKey,
    lastfmApiSecret,
  ]);

  useEffect(() => {
    if (!isPlaying || !currentTrack || hasScrobbledRef.current) return;
    if (!currentTrack.title) return;

    const dur = trackDurationSeconds || 0;
    if (dur > 0 && dur < 30) return;

    const threshold = dur > 0 ? Math.min(dur * 0.5, 240) : 30;

    if (progressSeconds >= threshold) {
      hasScrobbledRef.current = true;
      const startTime = Math.floor(Date.now() / 1000) - Math.floor(progressSeconds);

      if (listenbrainzEnabled && listenbrainzToken.trim()) {
        submitListenBrainzScrobble(listenbrainzToken, currentTrack, dur, startTime).then(res => {
          if (!res.success && res.error) {
            console.warn('[ListenBrainz Scrobble Error]:', res.error);
            showToast?.(`ListenBrainz scrobble failed: ${res.error}`);
          }
        });
      }

      if (lastfmEnabled && lastfmSessionKey.trim()) {
        submitLastFmScrobble(lastfmSessionKey, currentTrack, dur, startTime, lastfmApiKey, lastfmApiSecret).then(res => {
          if (!res.success && res.error) {
            console.warn('[Last.fm Scrobble Error]:', res.error);
            showToast?.(`Last.fm scrobble failed: ${res.error}`);
          }
        });
      }
    }
  }, [
    isPlaying,
    currentTrack,
    progressSeconds,
    trackDurationSeconds,
    listenbrainzEnabled,
    listenbrainzToken,
    lastfmEnabled,
    lastfmSessionKey,
    lastfmApiKey,
    lastfmApiSecret,
    showToast,
  ]);

  return {
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
  };
}
