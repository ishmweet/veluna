import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Mic2,
  Search,
  UserCheck,
  UserPlus,
  Music,
  X,
  Loader2,
  Sparkles
} from 'lucide-react';
import { FollowedArtist } from '../../types';
import { getTrackGradient } from '../../utils';

interface LiveArtistItem {
  name: string;
  avatar: string;
  subtitle: string;
  browseId: string;
}

interface ArtistsViewProps {
  followedArtists: FollowedArtist[];
  onToggleFollow: (artist: { name: string; avatar?: string; banner?: string }) => void;
  onArtistClick: (artistName: string, avatarUrl?: string) => void;
  onPlayArtist?: (artistName: string) => void;
  showToast?: (msg: string) => void;
}

export const ArtistsView: React.FC<ArtistsViewProps> = React.memo(({
  followedArtists,
  onToggleFollow,
  onArtistClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [ytArtistResults, setYtArtistResults] = useState<LiveArtistItem[]>([]);
  const activeQueryIdRef = useRef<number>(0);

  const followedSet = useMemo(() => {
    return new Set(followedArtists.map(a => a.name.toLowerCase()));
  }, [followedArtists]);

  const executeSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) {
      setYtArtistResults([]);
      setIsSearchingYt(false);
      return;
    }

    setIsSearchingYt(true);
    const queryId = ++activeQueryIdRef.current;

    try {
      const res = await invoke<string>('search_youtube_artists', { query: q });
      if (activeQueryIdRef.current !== queryId) return;

      const lines = res.trim().split('\n').filter(Boolean);
      const parsed: LiveArtistItem[] = [];
      const seen = new Set<string>();

      lines.forEach(line => {
        const parts = line.split('====');
        const name = parts[0]?.trim() || '';
        const avatar = parts[1]?.trim() || '';
        const subtitle = parts[2]?.trim() || 'Artist';
        const browseId = parts[3]?.trim() || '';

        const norm = name.toLowerCase();
        if (name && !seen.has(norm)) {
          seen.add(norm);
          parsed.push({
            name,
            avatar: avatar.startsWith('http') ? avatar : '',
            subtitle,
            browseId
          });
        }
      });

      setYtArtistResults(parsed);
      setIsSearchingYt(false);
    } catch {
      if (activeQueryIdRef.current === queryId) {
        setIsSearchingYt(false);
      }
    }
  }, []);

  // Live debounce search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setYtArtistResults([]);
      setIsSearchingYt(false);
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(q);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, executeSearch]);

  return (
    <div
      className="v-page-container flex-1 overflow-y-auto custom-scrollbar"
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '24px 30px 140px',
        position: 'relative',
        transform: 'translateZ(0)',
        willChange: 'scroll-position',
        contain: 'layout'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'rgba(57, 255, 20, 0.1)',
              border: '1px solid rgba(57, 255, 20, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--v-accent)'
            }}
          >
            <Mic2 size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--v-fg)', margin: 0, letterSpacing: '-0.02em' }}>
              Artists
            </h1>
            <div style={{ fontSize: '12.5px', color: 'var(--v-fg3)', marginTop: '2px' }}>
              {followedArtists.length} {followedArtists.length === 1 ? 'followed artist' : 'followed artists'}
            </div>
          </div>
        </div>

        {/* Polished Search Container with Search Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--v-bdr2)',
            borderRadius: '28px',
            padding: '4px 6px 4px 14px',
            width: '340px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--v-accent)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(57, 255, 20, 0.15), 0 6px 20px rgba(0, 0, 0, 0.35)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
          }}
          onBlur={e => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              e.currentTarget.style.borderColor = 'var(--v-bdr2)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.25)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            }
          }}
        >
          <Search
            size={16}
            style={{
              color: searchQuery.trim() ? 'var(--v-accent)' : 'var(--v-fg3)',
              flexShrink: 0,
              transition: 'color 0.15s ease'
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                executeSearch(searchQuery);
              }
            }}
            placeholder="Search artists on YouTube..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--v-fg)',
              fontSize: '13.5px',
              flex: 1,
              padding: '6px 4px',
              minWidth: 0
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setYtArtistResults([]);
              }}
              title="Clear"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: 'var(--v-fg3)',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--v-fg)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--v-fg3)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              <X size={13} />
            </button>
          )}
          <button
            onClick={() => executeSearch(searchQuery)}
            disabled={isSearchingYt || !searchQuery.trim()}
            title="Search Artists"
            style={{
              background: searchQuery.trim() ? 'var(--v-accent)' : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '20px',
              color: searchQuery.trim() ? '#000' : 'var(--v-fg3)',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: searchQuery.trim() && !isSearchingYt ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              if (searchQuery.trim() && !isSearchingYt) {
                e.currentTarget.style.filter = 'brightness(1.1)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.filter = 'none';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {isSearchingYt ? (
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Sparkles size={13} />
            )}
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* When searching: Display Live YouTube Artist Results */}
      {searchQuery.trim().length > 0 ? (
        <div>
          <div
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--v-fg3)',
              marginBottom: '16px'
            }}
          >
            {isSearchingYt ? `Searching YouTube for "${searchQuery}"...` : `Artists found for "${searchQuery}"`}
          </div>

          {ytArtistResults.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: '16px'
              }}
            >
              {ytArtistResults.map(item => {
                const isFollowed = followedSet.has(item.name.toLowerCase());

                return (
                  <div
                    key={item.name}
                    onClick={() => onArtistClick(item.name, item.avatar)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '22px 14px 18px',
                      borderRadius: '16px',
                      background: 'var(--v-bg2, #141212)',
                      border: isFollowed ? '1px solid rgba(57, 255, 20, 0.4)' : '1px solid var(--v-bdr2)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--v-accent)';
                      e.currentTarget.style.background = 'rgba(57, 255, 20, 0.04)';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = isFollowed ? 'rgba(57, 255, 20, 0.4)' : 'var(--v-bdr2)';
                      e.currentTarget.style.background = 'var(--v-bg2, #141212)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Actual YouTube Profile Picture */}
                    <div
                      style={{
                        width: '104px',
                        height: '104px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: getTrackGradient(item.name, 'artist'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '14px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.55)',
                        border: isFollowed ? '2px solid var(--v-accent)' : '2px solid rgba(255, 255, 255, 0.12)',
                        position: 'relative',
                        flexShrink: 0
                      }}
                    >
                      <Music size={32} style={{ color: 'rgba(255, 255, 255, 0.25)', position: 'absolute' }} />
                      {item.avatar && (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%'
                          }}
                          onError={e => {
                            e.currentTarget.style.display = 'none';
                          }}
                          loading="eager"
                          decoding="async"
                        />
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--v-fg)',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                        marginBottom: '4px'
                      }}
                    >
                      {item.name}
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--v-fg3)', textAlign: 'center', marginBottom: '12px' }}>
                      {item.subtitle || 'Artist'}
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onToggleFollow({ name: item.name, avatar: item.avatar, banner: item.avatar });
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: isFollowed ? 'rgba(57, 255, 20, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        border: isFollowed ? '1px solid var(--v-accent)' : '1px solid var(--v-bdr2)',
                        color: isFollowed ? 'var(--v-accent)' : 'var(--v-fg2)',
                        borderRadius: '9999px',
                        padding: '5px 14px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {isFollowed ? (
                        <>
                          <UserCheck size={12} strokeWidth={2.5} />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={12} strokeWidth={2.5} />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : !isSearchingYt ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--v-fg3)', fontSize: '13px' }}>
              No artists found on YouTube for "{searchQuery}".
            </div>
          ) : null}
        </div>
      ) : (
        /* Default View: Followed Artists Gallery */
        <div>
          {followedArtists.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: '16px'
              }}
            >
              {followedArtists.map(artist => (
                <div
                  key={artist.name}
                  onClick={() => onArtistClick(artist.name, artist.avatar)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '22px 14px 18px',
                    borderRadius: '16px',
                    background: 'var(--v-bg2, #141212)',
                    border: '1px solid var(--v-bdr2)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--v-accent)';
                    e.currentTarget.style.background = 'rgba(57, 255, 20, 0.04)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--v-bdr2)';
                    e.currentTarget.style.background = 'var(--v-bg2, #141212)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Actual YouTube Profile Picture */}
                  <div
                    style={{
                      width: '104px',
                      height: '104px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: getTrackGradient(artist.name, 'artist'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '14px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.55)',
                      border: '2px solid rgba(255, 255, 255, 0.12)',
                      position: 'relative',
                      flexShrink: 0
                    }}
                  >
                    <Music size={32} style={{ color: 'rgba(255, 255, 255, 0.25)', position: 'absolute' }} />
                    {artist.avatar && (
                      <img
                        src={artist.avatar}
                        alt={artist.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%'
                        }}
                        onError={e => {
                          e.currentTarget.style.display = 'none';
                        }}
                        loading="eager"
                        decoding="async"
                      />
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--v-fg)',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%',
                      marginBottom: '6px'
                    }}
                  >
                    {artist.name}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--v-accent)', fontWeight: 600 }}>
                    <UserCheck size={11} strokeWidth={2.5} />
                    <span>Following</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div
              style={{
                padding: '72px 24px',
                textAlign: 'center',
                margin: '0 auto'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(57, 255, 20, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--v-accent)'
                }}
              >
                <Mic2 size={26} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--v-fg)', margin: '0 0 6px 0' }}>
                No Followed Artists Yet
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--v-fg3)', margin: '0 auto', lineHeight: 1.5 }}>
                Search for any artist above to find and follow them directly from YouTube.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
