import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { Track } from '../types';
import { loadLS, saveLS } from '../utils';

export interface LyricLine {
  time: number;
  text: string;
}

export interface LyricsData {
  lines: LyricLine[];
  title: string;
  artist: string;
}

export function useLyrics(currentTrack: Track | null, trackDurationSeconds: number, progressSeconds: number) {
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsSource, setLyricsSourceState] = useState<string>(() => loadLS('vg_lyricsSource', 'lrclib'));

  const lyricsScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastScrolledLyricIdxRef = useRef<number>(-1);

  const setLyricsSource = useCallback((s: string) => {
    setLyricsSourceState(s);
    saveLS('vg_lyricsSource', s);
  }, []);

  const fetchLyrics = useCallback(() => {
    if (!currentTrack) return;
    const title = currentTrack.title;
    const artist = currentTrack.artist;
    if (!title || !artist) return;

    setLyricsLoading(true);
    setLyricsData(null);

    invoke<string>('fetch_lyrics', {
      title,
      artist,
      album: '',
      duration: trackDurationSeconds || 0,
      source: lyricsSource,
    })
      .then(raw => {
        try {
          const lines: LyricLine[] = JSON.parse(raw);
          setLyricsData({ lines, title, artist });
        } catch {
          setLyricsData({ lines: [], title, artist });
        }
      })
      .catch(() => setLyricsData({ lines: [], title, artist }))
      .finally(() => setLyricsLoading(false));
  }, [currentTrack, trackDurationSeconds, lyricsSource]);

  useEffect(() => {
    if (showLyrics && currentTrack) {
      fetchLyrics();
    }
  }, [showLyrics, currentTrack?.url, lyricsSource, fetchLyrics]);

  useEffect(() => {
    lastScrolledLyricIdxRef.current = -1;
  }, [currentTrack?.url, showLyrics]);

  useEffect(() => {
    if (!showLyrics || !lyricsScrollContainerRef.current) return;
    const lines = lyricsData?.lines || [];
    let currentIdx = lines.length > 0 ? lines.length - 1 : 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time > progressSeconds) {
        currentIdx = Math.max(0, i - 1);
        break;
      }
    }
    const el = lyricsScrollContainerRef.current;
    const active = el.querySelector('[data-active="true"]') as HTMLElement;
    if (active && (currentIdx !== lastScrolledLyricIdxRef.current || !el.getAttribute('data-scrolled'))) {
      active.scrollIntoView({ behavior: 'smooth', block: 'center' });
      lastScrolledLyricIdxRef.current = currentIdx;
      el.setAttribute('data-scrolled', 'true');
    }
  }, [showLyrics, progressSeconds, lyricsData]);

  useEffect(() => {
    if (!showLyrics) return;
    const onResize = () => {
      if (lyricsScrollContainerRef.current) {
        const active = lyricsScrollContainerRef.current.querySelector('[data-active="true"]') as HTMLElement;
        if (active) active.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [showLyrics]);

  return {
    showLyrics,
    setShowLyrics,
    lyricsData,
    setLyricsData,
    lyricsLoading,
    lyricsSource,
    setLyricsSource,
    lyricsScrollContainerRef,
    fetchLyrics,
  };
}
