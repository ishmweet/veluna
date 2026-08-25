import React, { useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Info,
  ListMusic,
  Music,
  Play,
  Search,
  Shuffle,
  X
} from 'lucide-react';
import { Track, Playlist, LocalTrack, CtxMenu, SettingsTab } from '../../types';
import { GENRES } from '../../constants';
import { getTrackGradient, cleanArtist } from '../../utils';
import { TrackRow, TrackRowSkeleton } from '../TrackRow';
import { VirtualTrackList } from '../VirtualTrackList';

interface HomeViewProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchHistory: string[];
  setSearchHistory?: React.Dispatch<React.SetStateAction<string[]>>;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  isSearching: boolean;
  hasSearched: boolean;
  setHasSearched?: (hasSearched: boolean) => void;
  searchError: string | null;
  setSearchError?: (err: string | null) => void;
  ytMusicTracks: Track[];
  setYtMusicTracks?: React.Dispatch<React.SetStateAction<Track[]>>;
  videoTracks: Track[];
  setVideoTracks?: React.Dispatch<React.SetStateAction<Track[]>>;
  tracks: Track[];
  setTracks?: React.Dispatch<React.SetStateAction<Track[]>>;
  searchTab: 'music' | 'video';
  setSearchTab: (tab: 'music' | 'video') => void;
  quickPicks: Track[];
  setQuickPicks?: React.Dispatch<React.SetStateAction<Track[]>>;
  searchRef?: React.RefObject<HTMLInputElement | null>;
  searchMusic: (override?: string) => Promise<void>;
  handlePlayTrack?: (track: Track, fromQueue?: boolean) => Promise<void>;
  resetSearch?: () => void;
  updateAvailable?: string | null;
  setActiveNav: (nav: any) => void;
  setSettingsTab?: (tab: SettingsTab) => void;
  isHydrated?: boolean;
  localTracks?: LocalTrack[];
  playHistory: Track[];
  playlists?: Playlist[];
  setPlaylists?: React.Dispatch<React.SetStateAction<Playlist[]>>;
  playCounts: Record<string, number>;
  currentTrack: Track | null;
  loadingTrackUrl: string | null;
  isLoadingTrack: boolean;
  isPlaying: boolean;
  hoveredTrackUrl?: string | null;
  setHoveredTrackUrl?: (url: string | null) => void;
  downloadingTracks: Record<string, number>;
  handlePlayInContext: (track: Track, list: Track[]) => void | Promise<void>;
  playAll?: (list: Track[]) => void;
  toggleLikeTrack: (track: Track) => void;
  isTrackLiked: (url: string) => boolean;
  handleDownload: (track: Track) => void;
  openCtx: (e: React.MouseEvent, menu: Omit<CtxMenu, 'x' | 'y'>) => void;
  prefetchOnHover?: (url: string) => void;
  clearSearchHistory?: () => void;
  removeSearchHistoryItem?: (item: string) => void;
  getTrackCover?: (track: Track | null | undefined) => string;
  setOpenPlaylistId?: (id: string | null) => void;
  showToast?: (msg: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  searchQuery,
  setSearchQuery,
  searchHistory,
  setSearchHistory,
  showHistory,
  setShowHistory,
  isSearching,
  hasSearched,
  setHasSearched,
  searchError,
  setSearchError,
  ytMusicTracks,
  setYtMusicTracks,
  videoTracks,
  setVideoTracks,
  tracks,
  setTracks,
  searchTab,
  setSearchTab,
  quickPicks,
  setQuickPicks,
  searchRef: customSearchRef,
  searchMusic,
  handlePlayTrack: _handlePlayTrack,
  resetSearch: _resetSearch,
  updateAvailable = null,
  setActiveNav,
  setSettingsTab,
  isHydrated = true,
  localTracks = [],
  playHistory,
  playlists = [],
  setPlaylists: _setPlaylists,
  playCounts,
  currentTrack,
  loadingTrackUrl,
  isLoadingTrack,
  isPlaying,
  hoveredTrackUrl: customHoveredTrackUrl,
  setHoveredTrackUrl: customSetHoveredTrackUrl,
  downloadingTracks,
  handlePlayInContext,
  playAll: customPlayAll,
  toggleLikeTrack,
  isTrackLiked,
  handleDownload,
  openCtx,
  prefetchOnHover: customPrefetchOnHover,
  clearSearchHistory: _clearSearchHistory,
  removeSearchHistoryItem: _removeSearchHistoryItem,
  getTrackCover: customGetTrackCover,
  setOpenPlaylistId,
  showToast: _showToast,
}) => {
  const defaultSearchRef = useRef<HTMLInputElement>(null);
  const searchRef = customSearchRef || defaultSearchRef;
  const [internalHoveredTrackUrl, setInternalHoveredTrackUrl] = React.useState<string | null>(null);
  const hoveredTrackUrl = customHoveredTrackUrl !== undefined ? customHoveredTrackUrl : internalHoveredTrackUrl;
  const setHoveredTrackUrl = customSetHoveredTrackUrl || setInternalHoveredTrackUrl;
  const prefetchOnHover = customPrefetchOnHover || (() => {});

  const playAll = customPlayAll || ((list: Track[]) => {
    if (list.length > 0) handlePlayInContext(list[0], list);
  });
  const getTrackCover = customGetTrackCover || ((track: Track | null | undefined) => track?.cover || '');

  const localAsTrack: Track[] = localTracks.map((lt, i) => ({
    id: -(i + 1),
    title: lt.title,
    artist: lt.artist || '',
    url: `local://${lt.path}`,
    cover: lt.cover || '',
    duration: lt.duration || '',
  }));

  const allTracksForGenre = [
    ...new Map(
      [
        ...quickPicks,
        ...playHistory,
        ...localAsTrack,
        ...playlists.flatMap(p => p?.tracks || []),
      ]
        .filter((t): t is Track => Boolean(t && t.url))
        .map(t => [t.url, t])
    ).values(),
  ];

  const genreScores: Record<string, { score: number; tracks: Track[] }> = {};
  GENRES.forEach(g => {
    genreScores[g.id] = { score: 0, tracks: [] };
  });

  allTracksForGenre.forEach(track => {
    const text = (track.title + ' ' + track.artist).toLowerCase();
    const playCount = playCounts[track.url] || 1;
    GENRES.forEach(g => {
      if (g.keywords.some(kw => text.includes(kw))) {
        genreScores[g.id].score += playCount;
        if (!genreScores[g.id].tracks.find(t => t.url === track.url)) {
          genreScores[g.id].tracks.push(track);
        }
      }
    });
  });

  GENRES.forEach(g => {
    genreScores[g.id].tracks.sort((a, b) => (playCounts[b.url] || 0) - (playCounts[a.url] || 0));
  });

  const activeGenres = GENRES.filter(g => genreScores[g.id].tracks.length >= 2)
    .sort((a, b) => genreScores[b.id].score - genreScores[a.id].score)
    .slice(0, 5);

  const topTracks = Object.entries(playCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([url]) => allTracksForGenre.find(t => t.url === url))
    .filter(Boolean) as Track[];
  const recentHistory = playHistory.slice(0, 5);
  const hour = new Date().getHours();
  let greeting = 'Welcome back';
  if (hour < 12) {
    greeting = 'Good Morning';
  } else if (hour < 17) {
    greeting = 'Good Afternoon';
  } else {
    greeting = 'Good Evening';
  }

  const scrollShelf = (e: React.MouseEvent, direction: 'left' | 'right') => {
    const btn = e.currentTarget as HTMLElement;
    const parent = btn.parentElement;
    if (parent) {
      const container = parent.querySelector('.shelf-scroll-container') as HTMLElement;
      if (container) {
        const offset = direction === 'left' ? -360 : 360;
        container.scrollBy({ left: offset, behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <div style={{padding:"16px 24px 10px",position:"relative",zIndex:30,flexShrink:0,display:"flex",justifyContent:"center"}}>
        <div className="v-home-search-container" onClick={e=>e.stopPropagation()}>
          <div style={{position:"relative",flex:1}}>
            <button
              type="button"
              onClick={() => { if (!isSearching && searchQuery.trim()) { setShowHistory(false); searchMusic(); } }}
              disabled={isSearching || !searchQuery.trim()}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "4px",
                width: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                cursor: searchQuery.trim() && !isSearching ? "pointer" : "default",
                zIndex: 2,
                color: searchQuery.trim() ? "var(--v-accent)" : "#8a807c",
                transition: "all .15s ease",
                padding: 0
              }}
              title="Search"
            >
              {isSearching
                ? <div style={{width:"15px",height:"15px",border:"2px solid var(--v-accent)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                : <Search size={16} /> }
            </button>
            <input ref={searchRef} type="text"
              placeholder="Search YouTube..."
              value={searchQuery} readOnly={isSearching}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => !isSearching && setShowHistory(searchHistory.length > 0)}
              onKeyDown={e => { if (e.key === 'Enter') { setShowHistory(false); searchMusic(); } if (e.key === 'Escape') setShowHistory(false); }}
              style={{width:'100%',height:'42px',background:'var(--v-bg2)',color:'#e2ddd9',border:`1px solid ${isSearching?'rgba(226,221,217,0.15)':'var(--v-bdr2)'}`,borderRadius:'21px',paddingTop:0,paddingBottom:0,paddingLeft:'44px',paddingRight:searchQuery?'38px':'16px',fontSize:'13.5px',outline:'none',opacity:isSearching?0.5:1,cursor:isSearching?'not-allowed':'text',transition:'border-color .15s',boxSizing:'border-box'}}
            />
            {searchQuery && !isSearching && (
              <button onClick={() => setSearchQuery('')}
                style={{position:"absolute",right:"12px",top:0,bottom:0,margin:"auto",background:"none",border:"none",color:"#8a807c",cursor:"pointer",display:"flex",alignItems:"center",padding:0}}
                onMouseEnter={e=>(e.currentTarget.style.color="#e2ddd9")}
                onMouseLeave={e=>(e.currentTarget.style.color="#8a807c")}>
                <X size={14}/>
              </button>
            )}
            {showHistory && (
              <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:'6px',background:'var(--v-bg2)',border:'1px solid var(--v-bdr2)',borderRadius:'12px',overflow:'hidden',boxShadow:'0 12px 32px rgba(0,0,0,0.7)',zIndex:100}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px',borderBottom:'1px solid var(--v-bdr2)'}}>
                  <span style={{fontSize:'9.5px',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#8a807c'}}>Recent Searches</span>
                  <button onClick={e=>{e.stopPropagation();setSearchHistory?.([]);setShowHistory(false);}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'11px',color:'#8a807c',transition:'color .12s'}} onMouseEnter={e=>(e.currentTarget.style.color='#b05555')} onMouseLeave={e=>(e.currentTarget.style.color='#8a807c')}>Clear</button>
                </div>
                {searchHistory.map((h, i) => (
                  <button key={i} onClick={e=>{e.stopPropagation();setSearchQuery(h);setShowHistory(false);searchMusic(h);}}
                    style={{width:'100%',display:'flex',alignItems:'center',gap:'10px',padding:'9px 14px',background:'transparent',border:'none',cursor:'pointer',textAlign:'left',transition:'background .08s'}}
                    onMouseEnter={e=>(e.currentTarget.style.background='rgba(226,221,217,0.04)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <Clock size={12} style={{color:'#8a807c',flexShrink:0}} />
                    <span style={{fontSize:'13px',color:'#9e9894',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{h}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {updateAvailable && (
            <button
              onClick={() => { setActiveNav('settings'); setSettingsTab?.('updates'); }}
              title={`Update available: v${updateAvailable}`}
              style={{
                flexShrink: 0,
                width: "42px",
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "21px",
                border: "1px solid var(--v-bdr2)",
                background: "var(--v-bg2)",
                color: "#8a807c",
                cursor: "pointer",
                position: "relative",
                transition: "all .15s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "var(--v-bdr3)";
                e.currentTarget.style.color = "#e2ddd9";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--v-bdr2)";
                e.currentTarget.style.color = "#8a807c";
              }}
            >
              <Info size={17} />
              <span style={{position:"absolute",top:"5px",right:"5px",width:"6px",height:"6px",borderRadius:"50%",background:"#9e9894"}}/>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{padding:"24px 30px 140px",zIndex:10}} onClick={()=>setShowHistory(false)}>
        {!hasSearched && !isSearching && quickPicks.length === 0 && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",minHeight:"280px",gap:"20px"}}>
            <div className="relative">
              <div style={{width:'56px',height:'56px',borderRadius:'12px',background:'var(--v-bg2)',border:'1px solid var(--v-bdr2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Music size={24} strokeWidth={1} style={{color:'#363230'}} />
              </div>
              <div style={{position:"absolute",bottom:"-6px",right:"-6px",width:"26px",height:"26px",background:"rgba(226,221,217,0.06)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Search size={12} className="text-[#d4cfcf]/60" />
              </div>
            </div>
            <div style={{textAlign:"center",display:"flex",flexDirection:"column",gap:"5px"}}>
              <p style={{fontSize:"13px",fontWeight:600,color:"#5c5755"}}>Search YouTube to start</p>
              <p style={{fontSize:"11px",color:"#363230"}}>Type above and press <kbd>Ctrl+F</kbd></p>
            </div>
          </div>
        )}

        {!hasSearched && !isSearching && quickPicks.length > 0 && isHydrated && (
          <div style={{display:"flex",flexDirection:"column",gap:"36px",paddingTop:"4px"}}>
            {/* Hero Greeting Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 0 8px 0'
            }}>
              <div>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: 'var(--v-fg)',
                  letterSpacing: '-0.02em',
                  margin: 0
                }}>{greeting}</h1>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--v-fg2)',
                  margin: '3px 0 0'
                }}>Ready to discover and play your favorite tracks?</p>
              </div>
              <div style={{
                zIndex: 1,
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}>
                {quickPicks.length > 0 && (
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <button
                      onClick={() => handlePlayInContext(quickPicks[0], quickPicks)}
                      style={{
                        display:'flex',alignItems:'center',gap:'6px',padding:'7px 14px',borderRadius:'20px',
                        background:'var(--v-accent)',color:'#0c0b0b',border:'none',fontSize:'12px',fontWeight:700,cursor:'pointer',
                        boxShadow:'0 4px 14px rgba(0,0,0,0.4)',transition:'transform 0.15s ease'
                      }}
                      onMouseEnter={e=>e.currentTarget.style.transform='scale(1.04)'}
                      onMouseLeave={e=>e.currentTarget.style.transform='none'}
                    >
                      <Play size={12} fill="#0c0b0b" />
                      <span>Resume</span>
                    </button>
                    <button
                      onClick={() => {
                        const shuffled = [...quickPicks].sort(() => 0.5 - Math.random());
                        if (shuffled[0]) handlePlayInContext(shuffled[0], shuffled);
                      }}
                      style={{
                        display:'flex',alignItems:'center',gap:'6px',padding:'7px 14px',borderRadius:'20px',
                        background:'rgba(255,255,255,0.06)',color:'var(--v-fg)',border:'1px solid rgba(255,255,255,0.08)',
                        fontSize:'12px',fontWeight:600,cursor:'pointer',transition:'background 0.15s ease'
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                    >
                      <Shuffle size={12} />
                      <span>Shuffle</span>
                    </button>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  marginLeft: '8px'
                }}>
                  <span style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--v-fg3)', fontWeight: 700 }}>Library</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--v-fg)', marginTop: '2px' }}>
                    {localAsTrack.length + playlists.reduce((acc, p) => acc + p.tracks.length, 0)} Tracks
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px'
              }}>
                <h2 style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--v-fg3)',
                  margin: 0
                }}>Recently Played</h2>
                <button
                  onClick={() => setQuickPicks?.([])}
                  style={{
                    background: 'transparent',
                    color: 'var(--v-fg3)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid transparent',
                    transition: 'color .12s, border-color .12s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--v-fg2)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--v-fg3)';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >Clear</button>
              </div>
              <div className="v-home-quickpicks-grid">
                {quickPicks.slice(0, 12).map((track, cardIdx) => {
                  const isActive = currentTrack?.url === track.url;
                  const isCardLoading = (loadingTrackUrl === track.url || (isActive && isLoadingTrack)) && !isPlaying;
                  return (
                    <div
                      key={track.url}
                      onClick={() => handlePlayInContext(track, quickPicks.slice(0, 12))}
                      onContextMenu={e => openCtx(e, { type: 'quickpick', track })}
                      style={{
                         display: 'flex',
                         alignItems: 'center',
                         gap: '12px',
                         padding: '8px 10px',
                         borderRadius: '8px',
                         cursor: 'pointer',
                         background: isActive ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                         border: '1px solid transparent',
                         transition: 'background .15s ease, transform .15s ease',
                         animation: `fadeUpSm .18s cubic-bezier(0.2,0,0,1) ${cardIdx * 25}ms both`,
                       }}
                       onMouseEnter={e => {
                         prefetchOnHover(track.url);
                         e.currentTarget.style.background = isActive ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.035)';
                       }}
                       onMouseLeave={e => {
                         e.currentTarget.style.background = isActive ? 'rgba(255, 255, 255, 0.04)' : 'transparent';
                       }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        position: 'relative',
                        background: getTrackGradient(track.title, track.artist),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.04)'
                      }}>
                        <Music size={14} style={{ position: 'absolute', color: 'rgba(255,255,255,0.2)' }} />
                        {getTrackCover(track) && (
                          <img
                            src={getTrackCover(track)}
                            alt={track.title}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                            loading="lazy"
                          />
                        )}
                        {isCardLoading ? (
                           <div style={{
                             position: 'absolute',
                             inset: 0,
                             background: 'rgba(0,0,0,0.2)',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center'
                           }}>
                             <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: 'spin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}>
                               <circle cx="12" cy="12" r="8.5" fill="none" stroke="rgba(226,221,217,0.2)" strokeWidth="2.5" />
                               <circle cx="12" cy="12" r="8.5" fill="none" stroke="#e2ddd9" strokeWidth="2.5" strokeDasharray="53.4" strokeDashoffset="36" strokeLinecap="round" />
                             </svg>
                           </div>
                        ) : isActive && isPlaying ? (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <div style={{
                              display: 'flex',
                              gap: '2px',
                              alignItems: 'flex-end',
                              height: '10px'
                            }}>
                              {[100, 65, 80].map((h, i) => (
                                <div
                                  key={i}
                                  style={{
                                    width: '2px',
                                    background: 'var(--v-accent)',
                                    borderRadius: '1px',
                                    height: `${h}%`,
                                    animation: `barBounce ${0.7 + i * 0.12}s ease-in-out ${i * 110}ms infinite`,
                                    transformOrigin: 'bottom'
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: isActive ? 'var(--v-accent)' : 'var(--v-fg)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.3
                        }}>{track.title}</div>
                        {cleanArtist(track.artist) && (
                          <div style={{
                            fontSize: '11.5px',
                            color: 'var(--v-fg2)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: '2px'
                          }}>{cleanArtist(track.artist)}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="v-home-split-layout">
              <div className="v-home-main-col">
                {activeGenres.map((genre, gIdx) => {
                  const genreTracks = genreScores[genre.id].tracks.slice(0, 10);
                  return (
                    <div
                      key={genre.id}
                      className="shelf-group"
                      style={{
                        position: 'relative',
                        animation: `fadeUp 0.22s cubic-bezier(0.2,0,0,1) ${gIdx * 60 + 100}ms both`
                      }}
                    >
                      <div className="v-section-head" style={{ marginBottom: '12px' }}>
                        <h2 style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'var(--v-fg3)',
                          margin: 0
                        }}>{genre.label}</h2>
                        <span style={{
                          fontSize: '10px',
                          color: 'var(--v-fg2)',
                          background: 'rgba(255,255,255,0.03)',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.04)'
                        }}>{genreTracks.length}</span>
                      </div>
                      <button
                        onClick={(e) => scrollShelf(e, 'left')}
                        className="shelf-nav-btn"
                        style={{
                          position: 'absolute',
                          left: '-16px',
                          top: '55%',
                          transform: 'translateY(-50%)',
                          zIndex: 10,
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          background: 'rgba(var(--v-bg2-rgb), 0.92)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--v-fg)',
                          cursor: 'pointer',
                          opacity: 0,
                          transition: 'opacity 0.2s, background 0.2s, transform 0.2s',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={(e) => scrollShelf(e, 'right')}
                        className="shelf-nav-btn"
                        style={{
                          position: 'absolute',
                          right: '-16px',
                          top: '55%',
                          transform: 'translateY(-50%)',
                          zIndex: 10,
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          background: 'rgba(var(--v-bg2-rgb), 0.92)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--v-fg)',
                          cursor: 'pointer',
                          opacity: 0,
                          transition: 'opacity 0.2s, background 0.2s, transform 0.2s',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                      <div
                        className="shelf-scroll-container"
                        style={{
                          display: 'flex',
                          gap: '12px',
                          overflowX: 'auto',
                          paddingBottom: '8px',
                          scrollbarWidth: 'none'
                        }}
                      >
                        {genreTracks.map((track, tIdx) => {
                          const isActive = currentTrack?.url === track.url;
                          const isCardLoading = (loadingTrackUrl === track.url || (isActive && isLoadingTrack)) && !isPlaying;
                          return (
                            <div
                              key={track.url}
                              onClick={() => handlePlayInContext(track, genreTracks)}
                              onContextMenu={e => openCtx(e, { type: 'track', track })}
                              className={`v-card${isActive ? ' v-card--active' : ''}`}
                              style={{
                                animationDelay: `${tIdx * 25 + gIdx * 60}ms`,
                                flexShrink: 0,
                                width: '160px',
                              }}
                              onMouseEnter={() => prefetchOnHover(track.url)}
                            >
                              <div style={{
                                position: 'relative',
                                aspectRatio: '1',
                                width: '100%',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                background: getTrackGradient(track.title, track.artist),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '8px'
                              }} className="v-card__art-container">
                                <Music size={24} style={{ position: 'absolute', color: 'rgba(255,255,255,0.15)' }} />
                                {getTrackCover(track) && (
                                  <img
                                    src={getTrackCover(track)}
                                    alt={track.title}
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                    onError={e => { e.currentTarget.style.display = 'none'; }}
                                    loading="lazy"
                                  />
                                )}
                                {isCardLoading ? (
                                   <div style={{
                                     position: 'absolute',
                                     inset: 0,
                                     background: 'rgba(0,0,0,0.2)',
                                     display: 'flex',
                                     alignItems: 'center',
                                     justifyContent: 'center'
                                   }}>
                                     <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: 'spin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}>
                                       <circle cx="12" cy="12" r="8.5" fill="none" stroke="rgba(226,221,217,0.15)" strokeWidth="2.5" />
                                       <circle cx="12" cy="12" r="8.5" fill="none" stroke="#e2ddd9" strokeWidth="2.5" strokeDasharray="53.4" strokeDashoffset="36" strokeLinecap="round" />
                                     </svg>
                                   </div>
                                ) : isActive && isPlaying ? (
                                  <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '12px' }}>
                                      {[100, 65, 80].map((h, j) => (
                                        <div
                                          key={j}
                                          style={{
                                            width: '2px',
                                            background: 'var(--v-accent)',
                                            borderRadius: '1px',
                                            height: `${h}%`,
                                            animation: `barBounce ${0.7 + j * 0.12}s ease-in-out ${j * 110}ms infinite`,
                                            transformOrigin: 'bottom'
                                          }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                                {!isActive && (
                                  <div
                                    className="v-card__hover-overlay"
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      background: 'rgba(0,0,0,0.45)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'opacity 0.2s ease',
                                      opacity: 0,
                                      zIndex: 5
                                    }}
                                  >
                                    <div style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '50%',
                                      background: 'var(--v-accent)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#0c0b0b',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                    }}>
                                      <Play size={14} style={{ fill: 'currentColor', marginLeft: '1px' }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="v-card__title" style={{
                                color: isActive ? 'var(--v-accent)' : 'var(--v-fg)',
                                lineHeight: 1.3
                              }}>{track.title}</div>
                              {cleanArtist(track.artist) && (
                                <div className="v-card__artist">{cleanArtist(track.artist)}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="v-home-sidebar-col">
                {topTracks.length >= 3 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '14px',
                    padding: '14px 14px 16px 14px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                    animation: 'fadeUp 0.22s cubic-bezier(0.2,0,0,1) 200ms both'
                  }}>
                    <h2 style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--v-fg)',
                      letterSpacing: '-0.01em',
                      margin: '0 0 10px 0'
                    }}>Most Played</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {topTracks.map((track, i) => {
                        const isActive = currentTrack?.url === track.url;
                        const count = playCounts[track.url] || 0;
                        const maxCount = playCounts[topTracks[0].url] || 1;
                        return (
                          <div
                            key={track.url}
                            onClick={() => handlePlayInContext(track, topTracks)}
                            onContextMenu={e => openCtx(e, { type: 'track', track })}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: isActive ? 'rgba(255,255,255,0.045)' : 'transparent',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              prefetchOnHover(track.url);
                              if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                            }}
                            onMouseLeave={e => {
                              if (!isActive) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: i === 0 ? '#d4af37' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--v-fg3)',
                              width: '16px',
                              textAlign: 'center',
                              flexShrink: 0,
                              fontVariantNumeric: 'tabular-nums'
                            }}>{i + 1}</div>

                            <div style={{
                              position: 'relative',
                              width: '36px',
                              height: '36px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              background: getTrackGradient(track.title, track.artist),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                              <Music size={12} style={{ position: 'absolute', color: 'rgba(255,255,255,0.2)' }} />
                              {getTrackCover(track) && (
                                <img
                                  src={getTrackCover(track)}
                                  alt={track.title}
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  onError={e => { e.currentTarget.style.display = 'none'; }}
                                  loading="lazy"
                                />
                              )}
                              {isActive && isPlaying && (
                                <div style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'rgba(0,0,0,0.45)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '10px' }}>
                                    {[100, 65, 80].map((h, j) => (
                                      <div
                                        key={j}
                                        style={{
                                          width: '2px',
                                          background: 'var(--v-accent)',
                                          borderRadius: '1px',
                                          height: `${h}%`,
                                          animation: `barBounce ${0.7 + j * 0.12}s ease-in-out ${j * 110}ms infinite`,
                                          transformOrigin: 'bottom'
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '12.5px',
                                fontWeight: 600,
                                color: isActive ? 'var(--v-accent)' : 'var(--v-fg)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                lineHeight: '1.25'
                              }}>{track.title}</div>
                              {cleanArtist(track.artist) && (
                                <div style={{
                                  fontSize: '11px',
                                  color: 'var(--v-fg2)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  marginTop: '1px'
                                }}>{cleanArtist(track.artist)}</div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                <div style={{
                                  flex: 1,
                                  height: '2px',
                                  background: 'var(--v-bdr2)',
                                  borderRadius: '1px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    height: '100%',
                                    background: 'var(--v-accent)',
                                    borderRadius: '1px',
                                    width: `${(count / maxCount) * 100}%`,
                                    transition: 'width 0.4s ease'
                                  }} />
                                </div>
                                <span style={{
                                  fontSize: '9.5px',
                                  color: 'var(--v-fg2)',
                                  fontVariantNumeric: 'tabular-nums',
                                  flexShrink: 0
                                }}>{count}×</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {recentHistory.length >= 3 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '14px',
                    padding: '14px 14px 16px 14px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                    animation: 'fadeUp 0.22s cubic-bezier(0.2,0,0,1) 250ms both'
                  }}>
                    <h2 style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--v-fg)',
                      letterSpacing: '-0.01em',
                      margin: '0 0 10px 0'
                    }}>Play History</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {recentHistory.map((track, i) => {
                        const isActive = currentTrack?.url === track.url;
                        return (
                          <div
                            key={track.url + i}
                            onClick={() => handlePlayInContext(track, recentHistory)}
                            onContextMenu={e => openCtx(e, { type: 'track', track })}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: isActive ? 'rgba(255,255,255,0.045)' : 'transparent',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                            }}
                            onMouseLeave={e => {
                              if (!isActive) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div style={{
                              position: 'relative',
                              width: '36px',
                              height: '36px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              background: getTrackGradient(track.title, track.artist),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                              <Music size={12} style={{ position: 'absolute', color: 'rgba(255,255,255,0.2)' }} />
                              {getTrackCover(track) && (
                                <img
                                  src={getTrackCover(track)}
                                  alt=""
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  onError={e => { e.currentTarget.style.display = 'none'; }}
                                  loading="lazy"
                                />
                              )}
                              {isActive && isPlaying && (
                                <div style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'rgba(0,0,0,0.45)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '10px' }}>
                                    {[100, 65, 80].map((h, j) => (
                                      <div
                                        key={j}
                                        style={{
                                          width: '2px',
                                          background: 'var(--v-accent)',
                                          borderRadius: '1px',
                                          height: `${h}%`,
                                          animation: `barBounce ${0.7 + j * 0.12}s ease-in-out ${j * 110}ms infinite`,
                                          transformOrigin: 'bottom'
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '12.5px',
                                fontWeight: 600,
                                color: isActive ? 'var(--v-accent)' : 'var(--v-fg)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                lineHeight: '1.25'
                              }}>{track.title}</div>
                              {cleanArtist(track.artist) && (
                                <div style={{
                                  fontSize: '11px',
                                  color: 'var(--v-fg2)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  marginTop: '1px'
                                }}>{cleanArtist(track.artist)}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeGenres.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '14px',
                    padding: '14px 14px 16px 14px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                    animation: 'fadeUp 0.22s cubic-bezier(0.2,0,0,1) 280ms both'
                  }}>
                    <h2 style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--v-fg)',
                      letterSpacing: '-0.01em',
                      margin: '0 0 10px 0'
                    }}>Veluna Insights</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {activeGenres.slice(0, 3).map(genre => {
                        const score = genreScores[genre.id].score;
                        const maxScore = genreScores[activeGenres[0].id]?.score || 1;
                        const percent = Math.min((score / maxScore) * 100, 100);
                        return (
                          <div key={genre.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                              <span style={{ color: 'var(--v-fg)', fontWeight: 600 }}>{genre.label}</span>
                              <span style={{ color: 'var(--v-fg2)', fontSize: '10.5px', fontVariantNumeric: 'tabular-nums' }}>{score} pts</span>
                            </div>
                            <div style={{ height: '2px', background: 'var(--v-bdr2)', borderRadius: '1px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: 'var(--v-accent)', width: `${percent}%`, borderRadius: '1px' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(255, 255, 255, 0.015)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '14px',
                  padding: '14px 14px 16px 14px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                  animation: 'fadeUp 0.22s cubic-bezier(0.2,0,0,1) 320ms both'
                }}>
                  <h2 style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--v-fg)',
                    letterSpacing: '-0.01em',
                    margin: '0 0 10px 0'
                  }}>Playlists</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {playlists.slice(0, 4).map(pl => {
                      const isLiked = pl.id === 'p1';
                      return (
                        <div
                          key={pl.id}
                          onClick={() => { setOpenPlaylistId?.(pl.id); setActiveNav('library'); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '6px 8px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: 'transparent',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            background: isLiked ? 'linear-gradient(135deg, rgba(224,85,85,0.12) 0%, rgba(255,255,255,0.02) 100%)' : 'rgba(255,255,255,0.025)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isLiked ? (
                              <Heart size={14} style={{ color: '#e05555', fill: 'rgba(220,60,60,0.15)' }} />
                            ) : (
                              <ListMusic size={14} style={{ color: 'var(--v-fg2)' }} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '12.5px',
                              fontWeight: 600,
                              color: 'var(--v-fg)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>{pl.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--v-fg2)', marginTop: '1px' }}>
                              {pl.tracks.length} tracks
                            </div>
                          </div>
                          <ChevronRight size={14} style={{ color: 'var(--v-fg3)' }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {hasSearched && (() => {
          const activeTracks = searchTab === 'music' ? (ytMusicTracks.length > 0 ? ytMusicTracks : tracks) : (videoTracks.length > 0 ? videoTracks : tracks);
          const hasAnyResults = ytMusicTracks.length > 0 || videoTracks.length > 0 || tracks.length > 0;
          return (
            <div className="v-home-search-results v-page-container">
              <div className="v-section-head" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <h2 style={{fontSize:'16px',fontWeight:700,color:'#e2ddd9',margin:0,textTransform:'none',letterSpacing:'normal'}}>
                    {isSearching ? 'SEARCHING YOUTUBE...' : `RESULTS FOR "${searchQuery}"`}
                  </h2>
                  {isSearching && <div style={{display:"flex",gap:"3px",alignItems:"flex-end",height:"16px"}}>{[100, 60, 80, 50].map((h, i) => <div key={i} style={{ width:"4px",borderRadius:"2px",background:"rgba(226,221,217,0.4)",height: `${h}%`, animation: `barBounce ${0.65 + i * 0.1}s ease-in-out ${i * 100}ms infinite`, transformOrigin: "bottom" }} />)}</div>}
                </div>
                {activeTracks.length > 0 && !isSearching && (
                  <button onClick={() => playAll(activeTracks)} style={{display:'flex',alignItems:'center',gap:'6px',padding:'5px 14px',background:'rgba(226,221,217,0.06)',border:'1px solid rgba(226,221,217,0.12)',color:'#9e9894',borderRadius:'9999px',cursor:'pointer',fontSize:'11px',fontWeight:600,transition:'background .12s'}}>
                    <Play size={11} style={{fill:'currentColor'}} /> Play All
                  </button>
                )}
              </div>

              {!isSearching && (ytMusicTracks.length > 0 || videoTracks.length > 0) && (
                <div style={{display:'flex',alignItems:'center',gap:'8px',margin:'10px 0 16px'}}>
                  <button
                    onClick={() => setSearchTab('music')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: searchTab === 'music' ? 'none' : '1px solid var(--v-bdr2)',
                      background: searchTab === 'music' ? 'var(--v-accent)' : 'var(--v-bg2)',
                      color: searchTab === 'music' ? '#0c0b0b' : '#8a807c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all .15s ease'
                    }}
                  >
                    <Music size={13} />
                    <span>YT Music</span>
                    {ytMusicTracks.length > 0 && <span style={{fontSize:'10.5px',opacity:0.8}}>({ytMusicTracks.length})</span>}
                  </button>
                  
                  <button
                    onClick={() => setSearchTab('video')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: searchTab === 'video' ? 'none' : '1px solid var(--v-bdr2)',
                      background: searchTab === 'video' ? 'var(--v-accent)' : 'var(--v-bg2)',
                      color: searchTab === 'video' ? '#0c0b0b' : '#8a807c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all .15s ease'
                    }}
                  >
                    <Play size={13} />
                    <span>Videos</span>
                    {videoTracks.length > 0 && <span style={{fontSize:'10.5px',opacity:0.8}}>({videoTracks.length})</span>}
                  </button>
                </div>
              )}

              {isSearching && (
                <>
                  <div style={{display:"flex",alignItems:"center",gap:"14px",padding:"0 12px 6px",borderBottom:"1px solid var(--v-bdr2)",marginBottom:"4px"}}>
                    <div style={{width:"26px",flexShrink:0}}/><div style={{width:"38px",flexShrink:0}}/>
                    <p style={{flex:1,fontSize:"9.5px",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#363230"}}>Title</p>
                    <div style={{width:"60px",flexShrink:0}}/>
                    <Clock size={12} style={{color:"#363230",width:"36px",flexShrink:0}}/>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:"3px",marginTop:"4px"}}>{Array.from({ length: 8 }).map((_, i) => <TrackRowSkeleton key={i} index={i} />)}</div>
                </>
              )}

              {!isSearching && activeTracks.length > 0 && (
                <>
                  <div style={{display:"flex",alignItems:"center",gap:"14px",padding:"0 12px 6px",borderBottom:"1px solid var(--v-bdr2)",marginBottom:"4px"}}>
                    <div style={{width:"26px",flexShrink:0}}/><div style={{width:"38px",flexShrink:0}}/>
                    <p style={{flex:1,fontSize:"9.5px",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#363230"}}>Title</p>
                    <div style={{width:"60px",flexShrink:0}}/>
                    <Clock size={12} style={{color:"#363230",width:"36px",flexShrink:0}}/>
                  </div>
                  <div style={{marginTop:"4px"}}>
                    <VirtualTrackList
                      items={activeTracks}
                      itemHeight={56}
                      keyExtractor={(track) => track.id || track.url}
                      renderItem={(track, i) => (
                        <TrackRow
                          track={track}
                          index={i}
                          isActive={currentTrack?.url === track.url}
                          isHovered={hoveredTrackUrl === track.url}
                          isLoadingTrack={(loadingTrackUrl === track.url || (currentTrack?.url === track.url && isLoadingTrack)) && !isPlaying}
                          isPlaying={isPlaying}
                          isLiked={isTrackLiked(track.url)}
                          isDownloading={(downloadingTracks[track.url] ?? 0)}
                          onPlay={() => handlePlayInContext(track, activeTracks)}
                          onHoverEnter={() => { setHoveredTrackUrl(track.url); prefetchOnHover(track.url); }}
                          onHoverLeave={() => setHoveredTrackUrl(null)}
                          onLike={() => toggleLikeTrack(track)}
                          onDownload={() => handleDownload(track)}
                          onCtx={e => openCtx(e, { type: 'track', track })}
                        />
                      )}
                    />
                  </div>
                </>
              )}

              {!isSearching && !hasAnyResults && (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"260px",gap:"16px",padding:"40px 20px",textAlign:"center"}}>
                  <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'var(--v-bg2)',border:'1px solid var(--v-bdr2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Search size={22} style={{color:'#8a807c'}} />
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
                    <h3 style={{fontSize:"14px",fontWeight:700,color:"#e2ddd9",margin:0}}>
                      {searchError ? "Search Error" : `No ${searchTab === 'music' ? 'YT Music' : 'Video'} results found for "${searchQuery}"`}
                    </h3>
                    <p style={{fontSize:"12px",color:"#8a807c",maxWidth:"360px",margin:0}}>
                      {searchError ? searchError : "Double check spelling or try switching tabs above."}
                    </p>
                  </div>
                  <div style={{display:"flex",gap:"10px",marginTop:"6px"}}>
                    <button onClick={() => searchMusic(searchQuery)}
                      style={{padding:"8px 16px",borderRadius:"8px",background:"var(--v-accent)",color:"#0c0b0b",border:"none",fontWeight:700,fontSize:"12px",cursor:"pointer"}}>
                      Try Again
                    </button>
                    <button onClick={() => { setHasSearched?.(false); setSearchQuery(''); setTracks?.([]); setYtMusicTracks?.([]); setVideoTracks?.([]); setSearchError?.(null); }}
                      style={{padding:"8px 16px",borderRadius:"8px",background:"var(--v-bg2)",color:"#e2ddd9",border:"1px solid var(--v-bdr2)",fontWeight:600,fontSize:"12px",cursor:"pointer"}}>
                      Back to Home
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </>
  );
};
