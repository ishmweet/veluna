# Veluna

<p align="center">
  <img src="https://github.com/rry0ku/veluna/blob/main/src-tauri/icons/128x128%402x.png?raw=true" alt="Veluna logo" width="128" />
</p>

<h3 align="center">You're paying for music you could be getting for free. Right now.</h3>

<p align="center">
A free, open-source desktop music player for people who are done with ads, subscriptions, and apps that spy on them.<br/>
Stream from YouTube. Download for offline use. Own your library. No account, ever.
</p>

<p align="center">
  <a href="https://github.com/rry0ku/veluna/releases"><img src="https://img.shields.io/badge/⬇%20Download%20for%20Windows%20%26%20Linux-39FF14?style=for-the-badge" alt="Download" /></a>
  <a href="https://discord.com/invite/u7QXUgPcqr"><img src="https://img.shields.io/badge/💬%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" /></a>
</p>

<p align="center">
  <img src="screenshots/ss1.png" alt="Veluna Home Dashboard" width="100%" />
</p>

<p align="center">
  <img src="screenshots/ss2.png" alt="Veluna Immersive Full-Screen Synced Lyrics" width="100%" />
</p>

[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows-informational?style=flat-square&logo=linux&logoColor=white)](https://github.com/rry0ku/veluna/releases)
[![License](https://img.shields.io/badge/license-MIT-39FF14?style=flat-square)](LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.com/invite/u7QXUgPcqr)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-stable-CE422B?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Stars](https://img.shields.io/github/stars/rry0ku/veluna?style=flat-square&color=39FF14)](https://github.com/rry0ku/veluna/stargazers)

**[Download](https://github.com/rry0ku/veluna/releases) · [Build from Source](#building-from-source) · [Contribute](CONTRIBUTING.md) · [Report a Bug](https://github.com/rry0ku/veluna/issues) · [Legal & Fair Use](#legal--fair-use)**

---

## What is Veluna?

Veluna is a native desktop music application built with Tauri (Rust + React). It's primarily a local library manager, playlist tool, and playback engine, with an optional streaming/search feature powered by `yt-dlp` and `mpv` for finding and previewing tracks from YouTube.

There's no account system, no telemetry, and no ads. It runs the same on Linux and Windows, and it's designed to stay light on system resources.

> **Note on the YouTube streaming feature:** this functions similarly to a web browser accessing YouTube, it does not host, redistribute, or store any copyrighted audio on Veluna's own infrastructure (there is none, everything runs locally on your machine). Downloaded files are saved locally for personal use only, the same category of use as `yt-dlp`, `youtube-dl`, or a browser's own "save video" extension. See [Legal & Fair Use](#legal--fair-use) below.

---

## Features

### 🔍 Streaming & Search
- Search YouTube directly from the app, with results split into **dual search categories** (**YT Music** for official audio releases and **Videos** for official music videos)
- Stream audio instantly via `yt-dlp` + `mpv` IPC, no video overhead, no buffering delay
- Search history dropdown (up to 8 recent queries) with one-click re-search
- **Quick Picks**, a strip of your 20 most recently played tracks on the home screen for instant replay
- **Genre Shelves**, the home screen auto-detects genres from your listening history and groups tracks into horizontal scrollable shelves (Hip-Hop, EDM, Pop, Rock, R&B, Lo-Fi, K-Pop, Phonk, and more)
- **Autoplay Recommendations**, automatically discovers and queues similar tracks when your active playlist or queue ends

### 📁 Offline Library
- Point Veluna at any local music folder; it scans recursively and enriches metadata in the background without blocking the UI
- **Local Track Cover Art Support**, dynamically reads embedded metadata covers or cached artwork for local files
- **Waveform Visualisation**, automatic waveform thumbnail generation for local audio tracks
- **Metadata Editor**, edit title, artist, and album tags directly on local files with changes written to disk
- Filter your library in real time, zero latency, pure in-memory search
- Drag-to-reorder tracks, rename or delete files from the UI, show any track in your file manager
- Export and import playlists in standard **M3U format**

### ⬇️ Downloads
- Download any YouTube track with one click from search results, right-click menu, or the download button beside the heart icon
- Choose your **audio format**: MP3, Opus, M4A, or FLAC
- Choose your **quality**: High (320kbps+), Medium (~128kbps), or Low
- **Embed Thumbnail**, cover art written directly into file metadata tags, alongside title, artist, and album
- **Duplicate Detection**, scans your download folder first and skips tracks you already have

### 🎵 Playlists
- Create, name, and describe playlists; edit or delete at any time; upload a custom cover image
- **Enhanced View Selector**, switch between grid and list views with smooth interactive scaling
- **Collapsible Sidebar Playlists** with clean active indicators and track count subtitles
- **Search within a playlist**, filter tracks by title or artist in real time
- **Liked Songs**, a built-in smart playlist. Heart any track anywhere in the app to add it
- **Import from Spotify**, export your Spotify playlist as a CSV via [exportify.net](https://exportify.net), upload it, and Veluna matches each track against YouTube with a live progress feed
- **Import from YouTube**, paste any public YouTube or YouTube Music playlist link for instant import with automatic title extraction and high-definition cover art

### 📋 Queue
- Add any track to the persistent queue from search results, playlists, or right-click menus
- Drag-to-reorder the queue at any time. Queue survives across sessions

### ▶️ Playback Engine
- **mpv backend** via IPC socket (Unix) / named pipe (Windows), full codec support, hardware decoding
- **Shuffle**, **Repeat** (Off / All / One), **Playback speed** (0.5x-2x)
- **Volume control** via slider, scroll wheel, or mute with memory
- **Seek bar** with waveform visualisation overlay on local files
- **A-B Loop**, loop any segment continuously until cleared
- **Bookmarks**, save one position per track, restored on next play
- **Continue Where Left Off**, saves position every 5 seconds per track
- **Next-track prefetching** for gapless transitions
- **EBU R128 Loudness Normalisation** and **Skip Silence** filters
- **3-Band Equalizer**, real-time bass, mid, and treble adjustment applied live

### 🎤 Lyrics
- Synced lyrics with **real-time line highlighting** that scrolls automatically as the song plays, click any line to seek
- **Immersive full-screen view**, blurred album art background, progress bar, controls, and scrolling lyrics side by side
- **Lyrics Source** selector: choose between **lrclib**, **Musixmatch**, or **NetEase**, with automatic fallback if your primary source fails

### 🎮 Discord Rich Presence
- Shows current playing track, artist, elapsed/remaining time, and album art on your Discord profile
- Interactive buttons for "Listen on YouTube" and "View on GitHub"

### 🖥️ System Tray *(optional)*
- Left-click to show/hide the window; tray menu with Play/Pause, Next, Previous, Show, Quit
- Closing the window hides to tray instead of exiting

### ⌨️ Controls & Shortcuts

| Action | Shortcut |
|--------|----------|
| Play / Pause | `Space` |
| Seek forward 10s | `→` |
| Seek backward 10s | `←` |
| Mute / Unmute | `M` |
| Focus search bar | `Ctrl+F` |
| Play / Pause (media key) | Hardware key |
| Next track (media key) | Hardware key |
| Previous track (media key) | Hardware key |

Media keys are registered globally and work even when the app is not in focus.

### 🐧 MPRIS2 Integration (Linux)
Veluna registers a full `org.mpris.MediaPlayer2.veluna` D-Bus service. Works with **playerctl**, **KDE Connect**, **GNOME Shell extensions**, and any MPRIS2-compatible widget.

### 📊 Stats
A personal listening analytics dashboard with **All Time** and **Last 7 Days** filtering:
- **Core Metrics**: Time Listened, total Tracks Played, Unique Tracks
- **Activity Chart**, interactive daily play activity over the last 30 or 7 days
- **Behavioral Insights**: Favorite Time, Unique Artists, Loyalty Index
- **Top Rankings**: Top Tracks, Top Artists, Top Genres

### ⚡ Low-Spec & Performance Mode
- **Zero-Lag Architecture**: Built-in toggle designed specifically for low-end hardware, older dual-core CPUs, and integrated Intel HD/UHD graphics
- **GPU Blur & Shadow Elimination**: Completely removes GPU-heavy `backdrop-filter: blur(...)` and box shadows in favor of a crisp, high-contrast flat obsidian aesthetic
- **Animation & Transition Stripping**: Disables all continuous CSS keyframe animations (spinners, equalizer waves, loading streams) and hover transforms for instantaneous, 0ms input response
- **Background Throttling**: Automatically pauses active animations and throttles background polling intervals when the app is minimized or hidden, reducing idle CPU/GPU usage to **0%**
- **Top-Left Status Badge**: Displays a quick `⚡ ECO MODE` indicator in the top-left navigation sidebar with instant access to settings

### 🌙 Sleep Timer
Preset buttons (5-90 min) or custom input. Live countdown in sidebar. Cancellable any time.

### 🖱️ Right-Click Context Menus
Available on every track: Play, Add to Queue, Add to Playlist, Download, Edit Metadata, Copy URL, Copy Title, Open in YouTube, Track Info.

### ⚙️ Settings
- **Downloads**: audio quality, format, destination folder, embed thumbnail, duplicate detection
- **Playback**: loudness normalization, skip silence, autoplay recommendations, 3-band equalizer
- **Integrations**: Discord Rich Presence, primary lyrics source
- **Appearance & Performance**: curated themes, custom accent and background color, default startup page, system tray toggle, and Low-Spec / Performance Mode
- **Storage**: backup location, create/restore backup, reset app data
- **Updates**: automatic update check against GitHub Releases

### 💾 Backup & Restore
Export all playlists, queue, play history, EQ settings, search history, and preferences as a single JSON file. Restore or reset any time.

---

## Installation

### Linux, Arch / Manjaro / EndeavourOS

Download the `.pkg.tar.zst` package from the [Releases](https://github.com/rry0ku/veluna/releases) page and install with `pacman`:

```bash
sudo pacman -U ./veluna_<version>-1-x86_64.pkg.tar.zst
```

Alternatively, build and install directly with `makepkg`:

```bash
git clone https://github.com/rry0ku/veluna.git
cd veluna/packaging
makepkg -si
```

### Linux, Debian / Ubuntu / Mint

```bash
sudo apt install ./veluna_<version>_amd64.deb
```

`apt` resolves and installs all required system dependencies automatically: `mpv`, `yt-dlp`, `ffmpeg`, `ffprobe`.

### Windows

Download and run the `.exe` installer from the [Releases](https://github.com/rry0ku/veluna/releases) page. The installer bundles all required binaries.

---

## Building from Source

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18+ | Frontend build |
| [Rust](https://rustup.rs/) | stable | `rustup install stable` |
| [Tauri CLI](https://tauri.app/start/prerequisites/) | v2 | `cargo install tauri-cli --version "^2"` |

### Clone & Build

```bash
git clone https://github.com/rry0ku/veluna.git
cd veluna
npm install
npm run tauri build
```

| Platform | Output path |
|---|---|
| Linux `.deb` | `src-tauri/target/release/bundle/deb/` |
| Linux `.rpm` | `src-tauri/target/release/bundle/rpm/` |
| Windows `.exe` | `src-tauri/target/release/bundle/nsis/` |

### Development Mode

```bash
npm run tauri dev
```

---

## How It Works

### Audio Pipeline

```
YouTube URL
    │
    ▼
yt-dlp (audio extraction, stdout pipe)
    │
    ▼
mpv (IPC-controlled via Unix socket / Windows named pipe)
    │
    ▼
System audio output (PipeWire / PulseAudio / DirectSound / WASAPI)
```

### Lyrics Pipeline

```
Track title + artist
    │
    ▼
Parallel fetch: primary source (lrclib / Musixmatch / NetEase) + fallbacks
    │
    ▼
LRC timestamps parsed → line-by-line sync against mpv progress
    │
    ▼
Immersive full-screen view with auto-scroll + seek-on-click
```

### Spotify Import Flow

```
User exports CSV from exportify.net
    │
    ▼
Veluna parses CSV → extracts title + artist pairs
    │
    ▼
Up to 12 concurrent yt-dlp searches run in parallel
    │
    ▼
Each match/failure updates the live progress list
    │
    ▼ (even if window was minimized)
Name & description popup appears when matching completes
    │
    ▼
Playlist saved to localStorage
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| UI Framework | React 19 + TypeScript | Component rendering, state management |
| Styling | Vanilla CSS | Custom design system, dynamic gradients, ambient blurs |
| Icons | lucide-react | All UI icons |
| Desktop Shell | Tauri v2 | Native window, IPC bridge, file system |
| Backend | Rust (stable) | All system operations |
| Audio Engine | mpv | Decoding and playback via IPC |
| Streaming / Download | yt-dlp | YouTube search, streaming, downloading |
| Media Info | ffprobe / ffmpeg | Metadata, waveform generation, format conversion |
| Discord RPC | discord-rich-presence | Live Discord status & interactive buttons |
| MPRIS2 | zbus 3 | D-Bus integration on Linux |
| Global Shortcuts | tauri-plugin-global-shortcut | Hardware media key support |
| File Dialogs | tauri-plugin-dialog | Folder/file pickers |
| URL Opening | tauri-plugin-opener | Opening links in system browser |
| HTTP | reqwest | Lyrics fetching, GitHub update check |

---

## Data & Privacy

All application state is stored locally in the webview's `localStorage` under `vg_*` prefixed keys. No database, no cloud sync, no external server. The only network requests Veluna makes:

| Request | When | Purpose |
|---|---|---|
| YouTube search / stream | When you search or play | Via yt-dlp |
| YouTube thumbnail images | When displaying track art | Direct img src |
| lrclib / Musixmatch / NetEase | When lyrics are opened | Synced lyrics fetch |
| GitHub Releases API | Once on startup | Update check |

No usage data, crash reports, or analytics are ever collected or transmitted. That's not a policy that could change one day. There's simply no code path that sends it anywhere.

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for complete guidelines on environment setup, branch naming, coding standards, and pull request submissions. For major changes, please open an issue first.

```bash
git clone https://github.com/rry0ku/veluna.git
cd veluna
npm install
npm run tauri dev
```

---

## Legal & Fair Use

Veluna does not host, mirror, or redistribute any copyrighted media. It is a local playback client, comparable in function to a web browser or to standalone tools like `yt-dlp` and `mpv`, which it uses under their own respective licenses. All streaming and download functionality operates by making the same publicly accessible requests a browser would; no content is cached, proxied, or served from any Veluna-owned infrastructure. There isn't any, everything runs locally on your machine.

Use of the streaming/download feature is intended for personal, non-commercial use in accordance with applicable copyright law in your jurisdiction, and is subject to YouTube's [Terms of Service](https://www.youtube.com/t/terms). Users are responsible for how they use this software. If you are a rights holder with a concern about this project, please open an issue rather than filing a takedown, most concerns can be resolved by adjusting behavior rather than removing the tool.

This project draws directly on the precedent set by [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) and [`youtube-dl`](https://github.com/ytdl-org/youtube-dl), both of which remain active, widely-used open-source projects under the same legal reasoning.

---

## License

MIT © [rry0ku](https://github.com/rry0ku)

---

*Built with Rust, React, and a native desktop player that respects your system resources.*
