$ErrorActionPreference = "Stop"

$binDir = Join-Path $PSScriptRoot "..\src-tauri\binaries"
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Force -Path $binDir | Out-Null
}

function Download-File($url, $dest) {
    if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
        curl.exe -fL -o $dest $url
        if ($LASTEXITCODE -ne 0) {
            throw "curl failed to download $url"
        }
    } else {
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    }
}

function Extract-ZipEntry($zipPath, $entryName, $destPath) {
    if (Test-Path $destPath) { Remove-Item $destPath -Force }
    
    if (Get-Command 7z -ErrorAction SilentlyContinue) {
        7z e $zipPath "-o$binDir" $entryName -r -y | Out-Null
        $extracted = Join-Path $binDir $entryName
        if (Test-Path $extracted) {
            if ($extracted -ne $destPath) {
                Move-Item $extracted $destPath -Force
            }
            return
        }
    }
    
    # Built-in .NET fallback (works on 100% of Windows machines without 7z)
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    try {
        $entry = $zip.Entries | Where-Object { $_.Name -eq $entryName } | Select-Object -First 1
        if ($entry) {
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destPath, $true)
        } else {
            throw "Entry '$entryName' not found inside $zipPath"
        }
    } finally {
        $zip.Dispose()
    }
}

Write-Host "==> [1/3] Setting up yt-dlp.exe..." -ForegroundColor Cyan
$ytdlpDest = Join-Path $binDir "yt-dlp-x86_64-pc-windows-msvc.exe"
Download-File "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" $ytdlpDest

Write-Host "==> [2/3] Setting up ffmpeg & ffprobe..." -ForegroundColor Cyan
$ffmpegZip = Join-Path $binDir "ffmpeg.zip"
Download-File "https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" $ffmpegZip
Extract-ZipEntry $ffmpegZip "ffmpeg.exe" (Join-Path $binDir "ffmpeg-x86_64-pc-windows-msvc.exe")
Extract-ZipEntry $ffmpegZip "ffprobe.exe" (Join-Path $binDir "ffprobe-x86_64-pc-windows-msvc.exe")
Remove-Item $ffmpegZip -Force

Write-Host "==> [3/3] Setting up mpv.exe..." -ForegroundColor Cyan
$headers = @{ "User-Agent" = "veluna-setup" }
if ($env:GITHUB_TOKEN) { $headers["Authorization"] = "Bearer $env:GITHUB_TOKEN" }
$mpvUrl = $null
try {
    $mpvRelease = Invoke-RestMethod -Uri "https://api.github.com/repos/mpv-player/mpv/releases/latest" -Headers $headers
    $mpvAsset = $mpvRelease.assets | Where-Object { $_.name -like "*x86_64-pc-windows-msvc.zip" } | Select-Object -First 1
    if ($mpvAsset) { $mpvUrl = $mpvAsset.browser_download_url }
} catch {
    Write-Host "GitHub API lookup skipped, using verified fallback URL..." -ForegroundColor Yellow
}
if (-not $mpvUrl) {
    $mpvUrl = "https://github.com/mpv-player/mpv/releases/download/v0.41.0/mpv-v0.41.0-x86_64-pc-windows-msvc.zip"
}

$mpvZip = Join-Path $binDir "mpv.zip"
Download-File $mpvUrl $mpvZip
Extract-ZipEntry $mpvZip "mpv.exe" (Join-Path $binDir "mpv-x86_64-pc-windows-msvc.exe")
Remove-Item $mpvZip -Force

Write-Host "`n[✓] All 4 Windows binaries successfully installed into src-tauri/binaries/:" -ForegroundColor Green
Get-ChildItem $binDir
