import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const binDir = path.resolve(__dirname, '..', 'src-tauri', 'binaries');

if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

async function downloadFile(url, destPath) {
  const fileName = path.basename(destPath);
  process.stdout.write(`Downloading ${fileName}... `);

  const headers = { 'User-Agent': 'veluna-setup' };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
  console.log('✓');
}

function extractZipEntry(zipPath, targetName, outPath) {
  const destDir = path.dirname(outPath);
  if (fs.existsSync(outPath)) {
    fs.unlinkSync(outPath);
  }

  if (process.platform === 'win32') {
    // Try 7z first if installed, else fallback to built-in .NET ZipFile
    try {
      execSync(`7z e "${zipPath}" "-o${destDir}" "${targetName}" -r -y`, { stdio: 'ignore' });
      const extracted = path.join(destDir, targetName);
      if (fs.existsSync(extracted)) {
        if (extracted !== outPath) {
          fs.renameSync(extracted, outPath);
        }
        return;
      }
    } catch {}

    const psCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('${zipPath}'); $entry = $zip.Entries | Where-Object { $_.Name -eq '${targetName}' } | Select-Object -First 1; if (-not $entry) { throw 'Not found' }; [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, '${outPath}', $true); $zip.Dispose()"`;
    execSync(psCmd, { stdio: 'inherit' });
  } else {
    // Linux / macOS
    try {
      execSync(`unzip -o -q -j "${zipPath}" "*${targetName}" -d "${destDir}"`);
      const extracted = path.join(destDir, targetName);
      if (fs.existsSync(extracted) && extracted !== outPath) {
        fs.renameSync(extracted, outPath);
      }
    } catch {
      execSync(`7z e "${zipPath}" "-o${destDir}" "${targetName}" -r -y`, { stdio: 'ignore' });
    }
  }
}

async function main() {
  console.log('==> Setting up Windows binaries in src-tauri/binaries/ ...\n');

  // 1. yt-dlp
  console.log('[1/3] Fetching yt-dlp.exe...');
  const ytdlpDest = path.join(binDir, 'yt-dlp-x86_64-pc-windows-msvc.exe');
  await downloadFile('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe', ytdlpDest);

  // 2. ffmpeg & ffprobe
  console.log('[2/3] Fetching ffmpeg & ffprobe...');
  const ffmpegZip = path.join(binDir, 'ffmpeg.zip');
  await downloadFile('https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip', ffmpegZip);

  process.stdout.write('Extracting ffmpeg.exe & ffprobe.exe... ');
  extractZipEntry(ffmpegZip, 'ffmpeg.exe', path.join(binDir, 'ffmpeg-x86_64-pc-windows-msvc.exe'));
  extractZipEntry(ffmpegZip, 'ffprobe.exe', path.join(binDir, 'ffprobe-x86_64-pc-windows-msvc.exe'));
  fs.unlinkSync(ffmpegZip);
  console.log('✓');

  // 3. mpv
  console.log('[3/3] Fetching mpv.exe...');
  let mpvUrl = null;
  try {
    const headers = { 'User-Agent': 'veluna-setup' };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const releaseRes = await fetch('https://api.github.com/repos/mpv-player/mpv/releases/latest', { headers });
    if (releaseRes.ok) {
      const releaseData = await releaseRes.json();
      const asset = releaseData.assets?.find(a => a.name?.includes('x86_64-pc-windows-msvc.zip'));
      if (asset) mpvUrl = asset.browser_download_url;
    }
  } catch {}

  if (!mpvUrl) {
    mpvUrl = 'https://github.com/mpv-player/mpv/releases/download/v0.41.0/mpv-v0.41.0-x86_64-pc-windows-msvc.zip';
  }

  const mpvZip = path.join(binDir, 'mpv.zip');
  await downloadFile(mpvUrl, mpvZip);

  process.stdout.write('Extracting mpv.exe... ');
  extractZipEntry(mpvZip, 'mpv.exe', path.join(binDir, 'mpv-x86_64-pc-windows-msvc.exe'));
  fs.unlinkSync(mpvZip);
  console.log('✓');

  console.log('\n[✓] All 4 Windows binaries successfully installed into src-tauri/binaries/:\n');
  const files = fs.readdirSync(binDir);
  for (const f of files) {
    const stats = fs.statSync(path.join(binDir, f));
    console.log(`  • ${f.padEnd(42)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  }
}

main().catch(err => {
  console.error('\n[x] Setup failed:', err);
  process.exit(1);
});
