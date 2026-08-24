# Contributing to Veluna

Thank you for your interest in contributing to Veluna. Veluna is an open-source desktop music player built with Tauri, Rust, and React. This document provides guidelines and instructions for setting up your development environment, creating branches, making changes, and submitting pull requests.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Development Environment Setup](#development-environment-setup)
  - [Linux Setup](#linux-setup)
  - [Windows Setup](#windows-setup)
- [Running the Application](#running-the-application)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Code Style and Architecture](#code-style-and-architecture)
- [Testing and Verification Expectations](#testing-and-verification-expectations)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Getting Help](#getting-help)

---

## Code of Conduct

All contributors and maintainers are expected to maintain a welcoming, respectful, and professional environment. Focus on constructive feedback and collaboration.

---

## Prerequisites

Before building Veluna, ensure you have the following core tools installed:

- **Node.js**: Version 18 or higher (LTS recommended)
- **npm**: Version 9 or higher (bundled with Node.js)
- **Rust and Cargo**: Stable toolchain (installed via `rustup`)
- **Git**: Version 2.0 or higher

To install or update Rust:

```bash
rustup update stable
```

---

## Development Environment Setup

### Linux Setup

Veluna depends on system-level libraries for webview rendering, window management, audio playback, and system tray integration.

#### 1. Arch Linux / Manjaro / EndeavourOS

Install the required packages using `pacman`:

```bash
sudo pacman -S --needed \
  mpv \
  yt-dlp \
  ffmpeg \
  openssl \
  pkg-config \
  webkit2gtk-4.1 \
  gtk3 \
  cairo \
  gdk-pixbuf2 \
  glib2 \
  libayatana-appindicator \
  librsvg
```

#### 2. Debian / Ubuntu / Linux Mint

Install the required packages using `apt`:

```bash
sudo apt update
sudo apt install -y \
  mpv \
  yt-dlp \
  ffmpeg \
  libssl-dev \
  pkg-config \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

#### 3. Fedora / RHEL

Install the required packages using `dnf`:

```bash
sudo dnf install -y \
  mpv \
  yt-dlp \
  ffmpeg \
  openssl-devel \
  pkg-config \
  webkit2gtk4.1-devel \
  gtk3-devel \
  glib2-devel \
  librsvg2-devel \
  libayatana-appindicator-gtk3-devel
```

---

### Windows Setup

Windows requires 64-bit runtime binaries for `mpv`, `yt-dlp`, `ffmpeg`, and `ffprobe` placed in `src-tauri/binaries/`.

#### 1. Automated Binary Setup

Veluna provides an automated setup script that downloads and extracts the correct sidecar binaries:

```bash
npm run setup:deps
```

#### 2. Manual Binary Setup (Alternative)

If you prefer to configure binaries manually:

1. Download `binaries.zip` from the latest [GitHub Release](https://github.com/rry0ku/veluna/releases).
2. Extract the contents directly into the `src-tauri/binaries/` directory.
3. Ensure the following files exist in `src-tauri/binaries/`:
   - `mpv-x86_64-pc-windows-msvc.exe`
   - `yt-dlp-x86_64-pc-windows-msvc.exe`
   - `ffmpeg-x86_64-pc-windows-msvc.exe`
   - `ffprobe-x86_64-pc-windows-msvc.exe`

---

## Running the Application

### 1. Clone the Repository

```bash
git clone https://github.com/rry0ku/veluna.git
cd veluna
```

### 2. Install Node Dependencies

```bash
npm install
```

### 3. Start in Development Mode

Run the development server with hot module replacement:

```bash
npm run tauri dev
```

### 4. Build Release Packages

To build production bundles (`.deb`, `.rpm`, or `.exe` depending on your host operating system):

```bash
npm run tauri build
```

---

## Branch Naming Conventions

Always create a new branch from `main` before starting work. Use descriptive branch names with appropriate prefixes:

| Category | Format | Example |
|---|---|---|
| Feature | `feature/<name>` | `feature/equalizer-presets` |
| Bug Fix | `bugfix/<name>` | `bugfix/mpris-metadata-sync` |
| Refactoring | `refactor/<name>` | `refactor/lyrics-parser` |
| Performance | `perf/<name>` | `perf/waveform-canvas-cache` |
| Documentation | `docs/<name>` | `docs/update-installation-guide` |
| CI / Build | `ci/<name>` | `ci/aur-auto-publish` |

---

## Commit Message Guidelines

Veluna follows the Conventional Commits specification. Write clear and descriptive commit messages:

```
<type>(<scope>): <subject>
```

### Commit Types

- **`feat`**: A new user-facing feature or enhancement
- **`fix`**: A bug fix
- **`refactor`**: Code changes that neither fix a bug nor add a feature
- **`perf`**: A code change that improves performance
- **`docs`**: Documentation changes only
- **`style`**: Changes that do not affect the meaning of the code (formatting, whitespace)
- **`test`**: Adding missing tests or correcting existing tests
- **`ci`**: Changes to CI configuration files and scripts
- **`chore`**: Maintenance tasks, dependency updates, build tooling

### Commit Examples

- `feat(lyrics): add support for synchronised lrc offset adjustments`
- `fix(audio): resolve ipc pipe reconnection issue on windows wakeup`
- `docs(readme): add contributing and release documentation`
- `chore(deps): update tauri dependencies to latest stable versions`

---

## Code Style and Architecture

### Frontend (React + TypeScript)

- Code is located in `src/`.
- UI sub-components reside in `src/components/`.
- Type definitions are centralized in `src/types.ts`.
- Pure helper functions and utilities reside in `src/utils.ts`.
- Constant values and default states are in `src/constants.ts`.
- Do not introduce large third-party runtime frameworks without discussion.
- Preserve existing comment documentation and type safety across all React components.

### Backend (Rust + Tauri v2)

- Backend code is located in `src-tauri/src/`.
- `main.rs` contains Tauri command handlers, IPC state observers, and audio engine management.
- `tray.rs` contains system tray definitions and event dispatching.
- Handle Rust errors gracefully using standard `Result` and typed errors; avoid unhandled panics or unwraps in runtime execution paths.

---

## Testing and Verification Expectations

Before submitting changes, verify that your modifications pass all compiler checks and build steps:

### 1. Frontend Verification

Ensure TypeScript compilation and Vite packaging succeed with zero errors:

```bash
npm run build
```

### 2. Backend Verification

Ensure the Rust codebase compiles and passes static analysis:

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

If you have `clippy` installed:

```bash
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

### 3. Manual Testing

Test the relevant functionality manually:
- Verify playback controls (play, pause, seek, volume, next, previous).
- Verify search functionality and track downloading.
- If modifying UI components, verify theme compatibility and responsive window resizing.

---

## Submitting a Pull Request

1. **Keep Pull Requests Focused**: Each pull request should address a single concern, feature, or bug fix. Avoid combining unrelated changes.
2. **Push to Your Fork / Branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
3. **Open a Pull Request**: Navigate to the repository on GitHub and open a pull request against the `main` branch.
4. **Complete the PR Template**: Fill out all sections of the pull request template, detailing what changed, the platforms tested, and steps taken for verification.
5. **Address Feedback**: Participate in the review process and make any requested adjustments promptly.

---

## Getting Help

If you have questions, need guidance, or want to discuss ideas before implementing them:

- Join our **Discord Community**: https://discord.com/invite/u7QXUgPcqr
- Open an issue on **GitHub**: https://github.com/rry0ku/veluna/issues
