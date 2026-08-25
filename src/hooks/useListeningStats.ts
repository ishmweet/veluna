import { useState, useEffect, useRef, useCallback } from 'react';
import { Track, ListeningEvent } from '../types';
import { loadLS, saveLS } from '../utils';

export function useListeningStats() {
  const [playCounts, setPlayCounts] = useState<Record<string, number>>(() => loadLS('vg_playCounts', {}));
  const [listenSecs, setListenSecs] = useState<Record<string, number>>(() => loadLS('vg_listenSecs', {}));
  const [firstSeen, setFirstSeen] = useState<Record<string, string>>(() => loadLS('vg_firstSeen', {}));
  const [dailyPlays, setDailyPlays] = useState<Record<string, number>>(() => loadLS('vg_dailyPlays', {}));
  const [listeningHistory, setListeningHistory] = useState<ListeningEvent[]>(() => loadLS('vg_listeningHistory', []));
  const [playHistory, setPlayHistory] = useState<Track[]>(() => loadLS('vg_playHistory', []));
  const [statsTimeRange, setStatsTimeRange] = useState<'7days' | 'all'>('all');

  const listenSecsRef = useRef(listenSecs);
  useEffect(() => {
    listenSecsRef.current = listenSecs;
    saveLS('vg_listenSecs', listenSecs);
  }, [listenSecs]);

  useEffect(() => {
    saveLS('vg_listeningHistory', listeningHistory);
  }, [listeningHistory]);

  useEffect(() => {
    saveLS('vg_playHistory', playHistory);
  }, [playHistory]);

  const recordTrackPlay = useCallback((track: Track, fromQueue: boolean = false) => {
    setPlayCounts(prev => {
      const n = { ...prev, [track.url]: (prev[track.url] || 0) + 1 };
      saveLS('vg_playCounts', n);
      return n;
    });

    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setDailyPlays(prev => {
      const n = { ...prev, [today]: (prev[today] || 0) + 1 };
      saveLS('vg_dailyPlays', n);
      return n;
    });

    setFirstSeen(prev => {
      if (prev[track.url]) return prev;
      const n = { ...prev, [track.url]: new Date().toISOString() };
      saveLS('vg_firstSeen', n);
      return n;
    });

    setListeningHistory(prev => [{ url: track.url, playedAt: new Date().toISOString(), secs: 0 }, ...prev].slice(0, 300));

    if (!fromQueue) {
      setPlayHistory(prev => [track, ...prev.filter(t => t.url !== track.url)].slice(0, 50));
    }
  }, []);

  const recordListeningStep = useCallback((url: string, step: number) => {
    setListenSecs(prev => {
      const next = { ...prev, [url]: (prev[url] || 0) + step };
      listenSecsRef.current = next;
      return next;
    });
    setListeningHistory(prev => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      next[0] = { ...next[0], secs: next[0].secs + step };
      return next;
    });
  }, []);

  const resetAllStats = useCallback(() => {
    setPlayCounts({});
    saveLS('vg_playCounts', {});
    setListenSecs({});
    saveLS('vg_listenSecs', {});
    setDailyPlays({});
    saveLS('vg_dailyPlays', {});
    setFirstSeen({});
    saveLS('vg_firstSeen', {});
    setListeningHistory([]);
    saveLS('vg_listeningHistory', []);
  }, []);

  const [artistThumbs, setArtistThumbs] = useState<Record<string, string>>(() => loadLS('vg_artistThumbs', {}));

  useEffect(() => {
    saveLS('vg_artistThumbs', artistThumbs);
  }, [artistThumbs]);

  return {
    playCounts,
    setPlayCounts,
    listenSecs,
    setListenSecs,
    listenSecsRef,
    firstSeen,
    setFirstSeen,
    dailyPlays,
    setDailyPlays,
    listeningHistory,
    setListeningHistory,
    playHistory,
    setPlayHistory,
    statsTimeRange,
    setStatsTimeRange,
    artistThumbs,
    setArtistThumbs,
    recordTrackPlay,
    recordTrackPlayed: recordTrackPlay,
    recordListeningStep,
    resetAllStats,
  };
}
