use lofty::file::{AudioFile, TaggedFileExt};
use lofty::prelude::*;
use lofty::probe::Probe;
use lofty::tag::{ItemKey, Tag};
use lofty::picture::{Picture, PictureType, MimeType};
use lofty::config::WriteOptions;
use std::path::Path;
use base64::Engine;

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct NativeTrackMeta {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration_secs: f64,
    pub duration_str: String,
    pub bitrate: Option<u32>,
    pub sample_rate: Option<u32>,
    pub size_bytes: u64,
    pub has_cover: bool,
    pub path: String,
    pub extension: String,
}

pub fn format_seconds_to_duration(secs: f64) -> String {
    if !secs.is_finite() || secs <= 0.0 {
        return "0:00".to_string();
    }
    let total_secs = secs as u64;
    let hours = total_secs / 3600;
    let mins = (total_secs % 3600) / 60;
    let s = total_secs % 60;
    if hours > 0 {
        format!("{}:{:02}:{:02}", hours, mins, s)
    } else {
        format!("{}:{:02}", mins, s)
    }
}

pub fn probe_track_metadata(path: &Path) -> Option<NativeTrackMeta> {
    let metadata = std::fs::metadata(path).ok()?;
    let size_bytes = metadata.len();
    let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    let file_stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("Unknown Track");

    let tagged_file = Probe::open(path).ok().and_then(|p| p.read().ok());

    let mut title = file_stem.to_string();
    let mut artist = String::new();
    let mut album = String::new();
    let mut duration_secs = 0.0;
    let mut bitrate = None;
    let mut sample_rate = None;
    let mut has_cover = false;

    if let Some(tf) = tagged_file {
        let properties = tf.properties();
        duration_secs = properties.duration().as_secs_f64();
        bitrate = properties.audio_bitrate();
        sample_rate = properties.sample_rate();

        if let Some(tag) = tf.primary_tag().or_else(|| tf.first_tag()) {
            if let Some(t) = tag.title().filter(|s| !s.trim().is_empty()) {
                title = t.trim().to_string();
            }
            if let Some(a) = tag.artist().filter(|s| !s.trim().is_empty()) {
                artist = a.trim().to_string();
            }
            if let Some(al) = tag.album().filter(|s| !s.trim().is_empty()) {
                album = al.trim().to_string();
            }
            has_cover = !tag.pictures().is_empty();
        }
    }

    // Fallback: If title contains "Artist - Title" and artist was empty, parse from filename
    if artist.is_empty() && title.contains(" - ") {
        let parts: Vec<&str> = title.splitn(2, " - ").collect();
        if parts.len() == 2 && !parts[0].trim().is_empty() && !parts[1].trim().is_empty() {
            artist = parts[0].trim().to_string();
            title = parts[1].trim().to_string();
        }
    }

    let duration_str = format_seconds_to_duration(duration_secs);

    Some(NativeTrackMeta {
        title,
        artist,
        album,
        duration_secs,
        duration_str,
        bitrate,
        sample_rate,
        size_bytes,
        has_cover,
        path: path.to_string_lossy().to_string(),
        extension: ext,
    })
}

pub fn extract_cover_art_data_uri(path: &Path) -> Option<String> {
    let tagged_file = Probe::open(path).ok()?.read().ok()?;
    let tag = tagged_file.primary_tag().or_else(|| tagged_file.first_tag())?;
    let picture = tag.pictures().first()?;

    let mime_str = match picture.mime_type() {
        Some(MimeType::Png) => "image/png",
        Some(MimeType::Jpeg) => "image/jpeg",
        Some(MimeType::Bmp) => "image/bmp",
        Some(MimeType::Gif) => "image/gif",
        Some(MimeType::Tiff) => "image/tiff",
        _ => "image/jpeg",
    };

    let encoded = base64::engine::general_purpose::STANDARD.encode(picture.data());
    Some(format!("data:{};base64,{}", mime_str, encoded))
}

pub fn write_track_tags(
    path: &Path,
    new_title: Option<&str>,
    new_artist: Option<&str>,
    new_album: Option<&str>,
) -> Result<(), String> {
    let mut tagged_file = Probe::open(path)
        .map_err(|e| format!("Failed to open file for tagging: {}", e))?
        .read()
        .map_err(|e| format!("Failed to read tags: {}", e))?;

    let tag_type = tagged_file.primary_tag_type();
    let tag = match tagged_file.tag_mut(tag_type) {
        Some(t) => t,
        None => {
            tagged_file.insert_tag(Tag::new(tag_type));
            tagged_file.tag_mut(tag_type).ok_or("Failed to create tag")?
        }
    };

    if let Some(t) = new_title {
        tag.set_title(t.trim().to_string());
    }
    if let Some(a) = new_artist {
        tag.set_artist(a.trim().to_string());
    }
    if let Some(al) = new_album {
        tag.set_album(al.trim().to_string());
    }

    tagged_file
        .save_to_path(path, WriteOptions::default())
        .map_err(|e| format!("Failed to save tags: {}", e))?;
    Ok(())
}

pub fn embed_cover_and_lyrics(
    path: &Path,
    image_bytes: Option<&[u8]>,
    lyrics_text: Option<&str>,
) -> Result<(), String> {
    let mut tagged_file = Probe::open(path)
        .map_err(|e| format!("Failed to open file: {}", e))?
        .read()
        .map_err(|e| format!("Failed to read tags: {}", e))?;

    let tag_type = tagged_file.primary_tag_type();
    let tag = match tagged_file.tag_mut(tag_type) {
        Some(t) => t,
        None => {
            tagged_file.insert_tag(Tag::new(tag_type));
            tagged_file.tag_mut(tag_type).ok_or("Failed to create tag")?
        }
    };

    if let Some(img) = image_bytes {
        if !img.is_empty() {
            tag.remove_picture_type(PictureType::CoverFront);
            let picture = Picture::new_unchecked(
                PictureType::CoverFront,
                Some(MimeType::Jpeg),
                None,
                img.to_vec(),
            );
            tag.push_picture(picture);
        }
    }

    if let Some(lrc) = lyrics_text {
        if !lrc.trim().is_empty() {
            tag.insert_text(ItemKey::Lyrics, lrc.to_string());
        }
    }

    tagged_file
        .save_to_path(path, WriteOptions::default())
        .map_err(|e| format!("Failed to save embedded metadata: {}", e))?;
    Ok(())
}
