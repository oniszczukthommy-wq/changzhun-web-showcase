//! QQ Music for Windows, using the system media session rather than credentials or a web API.
use crate::source::{Source, State, Track};

pub const ID_PREFIX: &str = "qqmusic:media:";
pub const BUNDLE: &str = "com.tencent.QQMusic";

#[cfg(windows)]
pub fn state() -> Option<State> {
    let s = crate::platform::windows::media::said_named("qqmusic")?;
    if s.title.trim().is_empty() || s.duration <= 0.0 { return None; }
    let id = crate::platform::windows::media::media_id(ID_PREFIX, &s.artist, &s.title, &s.album);
    // QQ Music's LastUpdatedTime can be hours old. Anchor a local clock when its
    // raw position or playback state changes, as for browser media sessions.
    let (position, exact) = CLOCK.get_or_init(Default::default).lock().unwrap_or_else(|e| e.into_inner())
        .read(&id, &s, std::time::Instant::now());
    EXACT.store(exact, std::sync::atomic::Ordering::Relaxed);
    Some(State { playing: s.playing, position, source: Source::QQMusic,
        track: Track { id, name: s.title, artist: s.artist, album: s.album, duration: s.duration, art: None, link: None } })
}

#[cfg(windows)]
static CLOCK: std::sync::OnceLock<std::sync::Mutex<crate::platform::windows::browsers::Clock>> = std::sync::OnceLock::new();
#[cfg(windows)]
static EXACT: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

#[cfg(not(windows))]
pub fn state() -> Option<State> { None }

pub fn control(action: &str) {
    #[cfg(windows)] crate::platform::windows::media::control("qqmusic", action);
    #[cfg(not(windows))] let _ = action;
}

/// Only a deliberate click or keyboard action uses this; background listening remains read-only.
pub fn toggle_playback() -> Result<(), &'static str> {
    #[cfg(windows)] { crate::platform::windows::media::toggle_playback("qqmusic") }
    #[cfg(not(windows))] { Err("当前系统不支持 QQ 音乐客户端控制。") }
}

pub fn seek(seconds: f64) {
    #[cfg(windows)] if seconds.is_finite() { crate::platform::windows::media::seek("qqmusic", seconds); }
    #[cfg(not(windows))] let _ = seconds;
}

pub fn exact_position() -> bool {
    #[cfg(windows)] { EXACT.load(std::sync::atomic::Ordering::Relaxed) }
    #[cfg(not(windows))] { false }
}

/// The Windows session exposes no QQ song ID. Only restart the song already selected by the user.
pub fn play_track(id: &str) -> bool {
    if state().is_some_and(|s| s.track.id == id) {
        seek(0.0);
        control("play");
        true
    } else { false }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn qq_media_ids_are_not_mistaken_for_platform_track_ids() {
        let id = "qqmusic:media:0123456789abcdef";
        assert_eq!(Source::of_id(id), Source::QQMusic);
        assert!(crate::trackids::is_media_id(id));
        assert_eq!(crate::store::app_key(Source::QQMusic), Some("qqmusic"));
        assert_eq!(crate::listen::source_of(BUNDLE), Source::QQMusic);
        assert!(crate::listen::allowed(BUNDLE, false, false, true));
    }

    #[cfg(windows)]
    #[test]
    fn stale_system_timestamp_does_not_freeze_the_qq_clock() {
        use crate::platform::windows::{browsers::Clock, media::Said};
        use std::time::{Duration, Instant};
        let mut clock = Clock::default();
        let start = Instant::now();
        let mut said = Said { title: "song".into(), playing: true, position: 2.0, duration: 200.0, ..Default::default() };
        assert_eq!(clock.read("qqmusic:media:test", &said, start), (2.0, false));
        assert_eq!(clock.read("qqmusic:media:test", &said, start + Duration::from_secs(10)), (12.0, false));
        said.playing = false;
        said.position = 12.0;
        assert_eq!(clock.read("qqmusic:media:test", &said, start + Duration::from_secs(11)), (12.0, true));
        assert_eq!(clock.read("qqmusic:media:test", &said, start + Duration::from_secs(20)), (12.0, true));
    }
}
