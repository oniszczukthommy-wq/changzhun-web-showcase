//! NetEase Cloud Music for Windows, using the system media session rather than credentials or a web API.
use crate::source::{Source, State, Track};

pub const ID_PREFIX: &str = "netease:media:";
pub const BUNDLE: &str = "com.netease.cloudmusic";

#[cfg(windows)]
pub fn state() -> Option<State> {
    let s = crate::platform::windows::media::said_named("cloudmusic")?;
    if s.title.trim().is_empty() { return None; }
    let id = crate::platform::windows::media::media_id(ID_PREFIX, &s.artist, &s.title, &s.album);
    // Some versions publish no timeline; the local clock is only an estimate. Anchor a local clock when its
    // raw position or playback state changes, as for browser media sessions.
    let (position, exact) = CLOCK.get_or_init(Default::default).lock().unwrap_or_else(|e| e.into_inner())
        .read(&id, &s, std::time::Instant::now());
    EXACT.store(exact, std::sync::atomic::Ordering::Relaxed);
    Some(State { playing: s.playing, position, source: Source::NetEase,
        track: Track { id, name: s.title, artist: s.artist, album: s.album, duration: s.duration, art: None, link: None } })
}

#[cfg(windows)]
static CLOCK: std::sync::OnceLock<std::sync::Mutex<crate::platform::windows::browsers::Clock>> = std::sync::OnceLock::new();
#[cfg(windows)]
static EXACT: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

#[cfg(not(windows))]
pub fn state() -> Option<State> { None }

pub fn control(action: &str) {
    #[cfg(windows)] crate::platform::windows::media::control("cloudmusic", action);
    #[cfg(not(windows))] let _ = action;
}

/// Only a deliberate click or keyboard action uses this; background listening remains read-only.
pub fn toggle_playback() -> Result<(), &'static str> {
    #[cfg(windows)] { crate::platform::windows::media::toggle_playback("cloudmusic") }
    #[cfg(not(windows))] { Err("当前系统不支持 网易云音乐客户端控制。") }
}

pub fn seek(seconds: f64) {
    #[cfg(windows)] if seconds.is_finite() { crate::platform::windows::media::seek("cloudmusic", seconds); }
    #[cfg(not(windows))] let _ = seconds;
}

pub fn exact_position() -> bool {
    #[cfg(windows)] { EXACT.load(std::sync::atomic::Ordering::Relaxed) }
    #[cfg(not(windows))] { false }
}

/// The session exposes no song ID or reliable seek. Select songs in the client.
pub fn play_track(_id: &str) -> bool { false }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn netease_media_ids_and_audio_are_routed_to_the_client() {
        let id = "netease:media:0123456789abcdef";
        assert_eq!(Source::of_id(id), Source::NetEase);
        assert!(crate::trackids::is_media_id(id));
        assert_eq!(crate::store::app_key(Source::NetEase), Some("netease"));
        assert_eq!(crate::listen::source_of(BUNDLE), Source::NetEase);
        assert!(crate::listen::allowed(BUNDLE, false, false, true));
        assert_eq!(crate::platform::exes::exes_for(BUNDLE), &["cloudmusic.exe"]);
        assert!(!crate::source::controllable(Source::NetEase));
        let timing = crate::source::PerSource::new(0);
        timing.set(Source::NetEase, 42);
        assert_eq!(timing.get(Source::NetEase), 42);
    }
}
