use std::fs;
use std::path::PathBuf;
use std::time::SystemTime;
use tauri::{AppHandle, Manager};

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct CacheInfo {
    pub total_bytes: u64,
    pub file_count: usize,
    pub formatted_size: String,
    pub cache_dir: String,
}

fn get_cache_directories(app: &AppHandle) -> Vec<PathBuf> {
    let mut dirs = Vec::new();

    if let Ok(app_cache) = app.path().app_cache_dir() {
        if !dirs.contains(&app_cache) {
            dirs.push(app_cache);
        }
    }

    let temp_veluna = std::env::temp_dir().join("veluna");
    if !dirs.contains(&temp_veluna) {
        dirs.push(temp_veluna);
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(home) = std::env::var("HOME") {
            let user_cache = PathBuf::from(home).join(".cache").join("veluna");
            if !dirs.contains(&user_cache) {
                dirs.push(user_cache);
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            let win_cache = PathBuf::from(local_app_data).join("veluna").join("cache");
            if !dirs.contains(&win_cache) {
                dirs.push(win_cache);
            }
        }
    }

    dirs
}

fn format_bytes(bytes: u64) -> String {
    const KB: f64 = 1024.0;
    const MB: f64 = 1024.0 * 1024.0;
    const GB: f64 = 1024.0 * 1024.0 * 1024.0;

    let b = bytes as f64;
    if b >= GB {
        format!("{:.2} GB", b / GB)
    } else if b >= MB {
        format!("{:.1} MB", b / MB)
    } else if b >= KB {
        format!("{:.0} KB", b / KB)
    } else {
        format!("{} B", bytes)
    }
}

fn scan_directory(dir: &PathBuf, files: &mut Vec<(PathBuf, u64, SystemTime)>) {
    if !dir.exists() || !dir.is_dir() {
        return;
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let is_protected = path.file_name().and_then(|n| n.to_str()).map(|n| {
                    n.ends_with(".db")
                        || n.ends_with(".sqlite")
                        || n.ends_with(".sqlite3")
                        || n.ends_with(".sock")
                        || n.ends_with(".lock")
                        || n.ends_with("-wal")
                        || n.ends_with("-shm")
                }).unwrap_or(false);

                if is_protected {
                    continue;
                }

                if let Ok(meta) = entry.metadata() {
                    let len = meta.len();
                    let modified = meta.modified().unwrap_or(SystemTime::UNIX_EPOCH);
                    files.push((path, len, modified));
                }
            } else if path.is_dir() {
                scan_directory(&path, files);
            }
        }
    }
}

#[tauri::command]
pub async fn get_cache_info(app: AppHandle) -> Result<CacheInfo, String> {
    tokio::task::spawn_blocking(move || {
        let dirs = get_cache_directories(&app);
        let mut files = Vec::new();

        for d in &dirs {
            scan_directory(d, &mut files);
        }

        let total_bytes: u64 = files.iter().map(|(_, len, _)| *len).sum();
        let file_count = files.len();
        let formatted_size = format_bytes(total_bytes);
        let primary_dir = dirs.first().map(|p| p.to_string_lossy().to_string()).unwrap_or_default();

        Ok(CacheInfo {
            total_bytes,
            file_count,
            formatted_size,
            cache_dir: primary_dir,
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn clear_app_cache(app: AppHandle) -> Result<u64, String> {
    tokio::task::spawn_blocking(move || {
        let dirs = get_cache_directories(&app);
        let mut files = Vec::new();

        for d in &dirs {
            scan_directory(d, &mut files);
        }

        let mut reclaimed_bytes: u64 = 0;
        for (path, len, _) in files {
            if fs::remove_file(&path).is_ok() {
                reclaimed_bytes += len;
            }
        }

        Ok(reclaimed_bytes)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn prune_cache_if_needed(app: AppHandle, max_bytes: u64) -> Result<u64, String> {
    tokio::task::spawn_blocking(move || {
        if max_bytes == 0 {
            return Ok(0);
        }

        let dirs = get_cache_directories(&app);
        let mut files = Vec::new();

        for d in &dirs {
            scan_directory(d, &mut files);
        }

        let mut current_bytes: u64 = files.iter().map(|(_, len, _)| *len).sum();
        if current_bytes <= max_bytes {
            return Ok(0);
        }

        files.sort_by_key(|(_, _, modified)| *modified);

        let target_bytes = (max_bytes as f64 * 0.85) as u64;
        let mut pruned_bytes: u64 = 0;

        for (path, len, _) in files {
            if current_bytes <= target_bytes {
                break;
            }
            if fs::remove_file(&path).is_ok() {
                current_bytes = current_bytes.saturating_sub(len);
                pruned_bytes += len;
            }
        }

        Ok(pruned_bytes)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(0), "0 B");
        assert_eq!(format_bytes(512), "512 B");
        assert_eq!(format_bytes(1024), "1 KB");
        assert_eq!(format_bytes(1024 * 1024), "1.0 MB");
        assert_eq!(format_bytes(1024 * 1024 * 1024), "1.00 GB");
        assert_eq!(format_bytes(500 * 1024 * 1024), "500.0 MB");
    }

    #[test]
    fn test_scan_and_prune_logic() {
        let temp_dir = std::env::temp_dir().join("veluna_test_cache_prune");
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).unwrap();

        // Create 3 dummy files
        let f1 = temp_dir.join("f1.tmp");
        let f2 = temp_dir.join("f2.tmp");
        let f3 = temp_dir.join("f3.tmp");
        let f_db = temp_dir.join("veluna.db");

        fs::write(&f1, vec![1u8; 1000]).unwrap();
        fs::write(&f2, vec![2u8; 1000]).unwrap();
        fs::write(&f3, vec![3u8; 1000]).unwrap();
        fs::write(&f_db, vec![9u8; 5000]).unwrap();

        let mut files = Vec::new();
        scan_directory(&temp_dir, &mut files);
        // Only the 3 .tmp files should be scanned; veluna.db is protected
        assert_eq!(files.len(), 3);
        let total: u64 = files.iter().map(|(_, len, _)| *len).sum();
        assert_eq!(total, 3000);

        // Verify pruning logic: if max is 2000, target is 1700 (85%), so at least 2 files must be pruned
        files.sort_by_key(|(_, _, modified)| *modified);
        let max_bytes = 2000u64;
        let target_bytes = (max_bytes as f64 * 0.85) as u64;
        let mut current_bytes = total;
        let mut pruned = 0u64;

        for (path, len, _) in files {
            if current_bytes <= target_bytes {
                break;
            }
            if fs::remove_file(&path).is_ok() {
                current_bytes = current_bytes.saturating_sub(len);
                pruned += len;
            }
        }

        assert_eq!(pruned, 2000);
        assert_eq!(current_bytes, 1000);
        assert!(f_db.exists()); // Protected DB file still intact!

        let _ = fs::remove_dir_all(&temp_dir);
    }
}

