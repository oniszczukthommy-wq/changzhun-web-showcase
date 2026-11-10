//! QQ Music's official web player, through user-enabled browser Apple Events.
//! Read only song metadata and its visible progress bar; never cookies, audio URLs or account data.
//! The progress bar is rounded by QQ: this is an estimated clock, refined by the engine's audio alignment.
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};
use serde_json::{json, Value};
use crate::{source::{Source, State, Track}, youtube::Browser};
pub const ID_PREFIX: &str = "qqmusic:";
const PAGE: &str = include_str!("qqmusic-page.js");
static FOLLOWED: Mutex<Option<(Browser, String, String)>> = Mutex::new(None);
static STATUS: OnceLock<Mutex<Value>> = OnceLock::new();
fn status_cell() -> &'static Mutex<Value> { STATUS.get_or_init(|| Mutex::new(json!({"state":"off"}))) }
pub fn enabled() -> bool { crate::settings::get("qqmusic") }
pub fn browser() -> Browser {
    match crate::settings::get_str("qqmusic_browser").as_deref() {
        Some("ego") => Browser::Ego, Some("safari") => Browser::Safari, Some("edge") => Browser::Edge, Some("brave") => Browser::Brave,
        _ => Browser::Chrome,
    }
}
pub fn status() -> Value {
    let mut s = status_cell().lock().unwrap().clone();
    if !enabled() { s = json!({"state":"off"}); }
    s["browser"] = json!(browser().name()); s
}
fn note(state: &str) { *FOLLOWED.lock().unwrap()=None; *status_cell().lock().unwrap() = json!({"state":state}); }
pub fn reset() { *CACHE.lock().unwrap()=None; note(if enabled(){"waiting"}else{"off"}); }
fn literal(s: &str) -> String { serde_json::to_string(&s.lines().map(str::trim).collect::<Vec<_>>().join(" ")).unwrap() }
fn script(b: Browser, js: &str) -> String {
    let run = match b { Browser::Safari => format!("do JavaScript {} in t", literal(js)), _ => format!("execute t javascript {}",literal(js)) };
    format!(r#"tell application id "{bundle}"
set output to ""
repeat with w in windows
repeat with t in tabs of w
set address to URL of t
if address starts with "https://y.qq.com/n/ryqq_v2/player" or address starts with "https://y.qq.com/n/ryqq/player" then
try
set output to output & ({run}) & linefeed
on error
return "BLOCKED"
end try
end if
end repeat
end repeat
return output
end tell"#,bundle=b.app_bundle())
}
#[derive(serde::Deserialize, Default)]
#[serde(default)]
struct Page { status:String, tab:String, mid:String, name:String, artist:String, album:String, art:String, duration:f64, position:f64, playing:bool }
fn valid_mid(mid:&str)->bool { !mid.is_empty() && mid.len()<=64 && mid.chars().all(|c|c.is_ascii_alphanumeric()) }
fn to_state(p:&Page)->Option<State> {
    if p.status!="ready" || !valid_mid(&p.tab) || !valid_mid(&p.mid) || p.name.trim().is_empty() || !p.duration.is_finite() || p.duration<=0.0 || !p.position.is_finite() || p.position<0.0 || p.position>p.duration+1.0 {return None;}
    Some(State { playing:p.playing, position:p.position.min(p.duration),source:Source::QQMusic,
        track:Track{id:format!("{ID_PREFIX}{}",p.mid),name:p.name.clone(),artist:p.artist.clone(),album:p.album.clone(),duration:p.duration,
            art:p.art.starts_with("https://").then(||p.art.clone()),link:None} })
}
// Cached separately from the engine's fast audio loop: at most 2.5 browser reads a second.
static CACHE: Mutex<Option<(Instant, Browser, Option<State>)>> = Mutex::new(None);
pub fn state()->Option<State> {
    if !enabled(){return None;}
    let b=browser();
    if let Some((at,old,s))=CACHE.lock().unwrap().as_ref() {
        if *old==b && at.elapsed()<Duration::from_millis(400) {
            let mut s=s.clone();if let Some(s)=s.as_mut().filter(|s|s.playing){s.position=(s.position+at.elapsed().as_secs_f64()).min(s.track.duration);}return s;
        }
    }
    let result = read(b);
    *CACHE.lock().unwrap()=Some((Instant::now(),b,result.clone())); result
}
fn read(b:Browser)->Option<State> {
    if !crate::source::app_running(b.app_bundle()){note("browser_closed");return None;}
    let Some(out)=crate::source::osa(b.name(),&script(b,PAGE)) else { note("automation_required");return None; };
    if out.trim()=="BLOCKED" {note("javascript_required");return None;}
    let pages:Vec<Page>=out.lines().filter_map(|l|serde_json::from_str(l).ok()).collect();
    let states:Vec<(State,String)>=pages.iter().filter_map(|p|to_state(p).map(|s|(s,p.tab.clone()))).collect();
    // Never pick an arbitrary playing tab when two QQ players are sounding.
    if states.iter().filter(|(s,_)|s.playing).count()>1 {note("multiple_players");return None;}
    let selected=states.iter().find(|(s,_)|s.playing).or_else(||states.first()).cloned();
    if !enabled() || browser()!=b { return None; }
    let s=selected.as_ref().map(|(s,_)|s.clone());
    if let Some(s)=&s {
        *FOLLOWED.lock().unwrap()=Some((b,s.track.id.clone(),selected.as_ref().unwrap().1.clone()));
        *status_cell().lock().unwrap()=json!({"state":"ready","name":s.track.name,"playing":s.playing,"clock":"page_progress"});
    }else{note(if pages.iter().any(|p|p.status=="autoplay_required"){"autoplay_required"}else if pages.is_empty(){"open_player"}else{"not_ready"});}
    s
}
pub fn is_following(bundle:&str)->bool {
    enabled() && browser().audio_bundle()==bundle && FOLLOWED.lock().unwrap().as_ref().is_some_and(|(b,_,_)|*b==browser())
}
pub fn control(action:&str) {
    let js=match action {
        "playpause"=>"document.querySelector('.btn_big_play')?.click()",
        "play"=>"if(!document.querySelector('.btn_big_play--pause'))document.querySelector('.btn_big_play')?.click()",
        "pause"=>"document.querySelector('.btn_big_play--pause')?.click()",
        "next"=>"document.querySelector('.btn_big_next')?.click()",
        "previous"=>"document.querySelector('.btn_big_prev')?.click()",
        "restart"=>{seek(0.0);return;}, _=>return,
    };run_current(js);
}
fn run_current(js:&str) {
    if !enabled(){return;}
    let Some((b,id,tab))=FOLLOWED.lock().unwrap().clone() else{return;};
    if b!=browser(){return;}
    let Some(mid)=id.strip_prefix(ID_PREFIX).filter(|id|valid_mid(id)) else{return;};
    // Exact song identity guard: controls never act on another QQ player or another website.
    let guarded=format!("(function(){{if(location.hostname!=='y.qq.com'||window.__changzhunQQTab!=='{tab}')return '';var a=document.querySelector('.song_info__name a');if(!a||!new RegExp('/songDetail/{mid}(?:[?/#]|$)').test(a.getAttribute('href')))return '';{js};return 'ok';}})()");
    let _=crate::source::osa(b.name(),&script(b,&guarded));
    *CACHE.lock().unwrap()=None;
}
pub fn seek(seconds:f64) {
    if !seconds.is_finite(){return;}
    let s=seconds.max(0.0);
    run_current(&format!("var text=document.querySelector('.player_music__time')?.textContent||'';var d=text.split('/')[1]?.trim().split(':').reduce((n,x)=>n*60+Number(x),0);var p=document.querySelector('.player_progress:not(.player_voice) .player_progress__inner');if(p&&d>0){{var r=p.getBoundingClientRect();p.dispatchEvent(new MouseEvent('click',{{bubbles:true,clientX:r.left+Math.min(1,{s:.3}/d)*r.width,clientY:r.top+r.height/2}}));}}"));
}
pub fn url(id:&str)->Option<String> {let mid=id.strip_prefix(ID_PREFIX).filter(|m|valid_mid(m))?;Some(format!("https://y.qq.com/n/ryqq_v2/songDetail/{mid}"))}
pub fn play_track(id:&str) {
    if FOLLOWED.lock().unwrap().as_ref().is_some_and(|(_,track,_)|track==id) {seek(0.0);control("play");}
    else if let Some(url)=url(id){let _=std::process::Command::new("open").args(["-a",browser().name(),&url]).spawn();note("click_play");}
}
#[cfg(test)] mod tests {
    use super::*;
    #[test] fn validates_player_metadata_and_stable_ids(){
        let mut p=Page{status:"ready".into(),tab:"czunit".into(),mid:"003nYgF01aN0yF".into(),name:"月亮代表我的心".into(),artist:"邓丽君".into(),duration:215.0,position:23.5,playing:true,..Default::default()};
        let s=to_state(&p).unwrap();assert_eq!(s.track.id,"qqmusic:003nYgF01aN0yF");assert_eq!(s.source,Source::QQMusic);assert_eq!(s.position,23.5);
        for id in ["","../x","x';alert(1)","x?y"] {p.mid=id.into();assert!(to_state(&p).is_none());assert!(url(&format!("qqmusic:{id}")).is_none());}
        p.mid="abc".into();p.position=f64::NAN;assert!(to_state(&p).is_none());p.position=500.0;assert!(to_state(&p).is_none());
    }
    #[test] fn scripts_target_only_qq_players(){let s=script(Browser::Chrome,PAGE);assert!(s.contains("https://y.qq.com/n/ryqq_v2/player"));assert!(s.contains("execute t javascript"));assert!(script(Browser::Safari,PAGE).contains("do JavaScript"));assert!(script(Browser::Ego,PAGE).contains("com.citrolabs.ego.lite"));assert_eq!(Browser::Ego.audio_bundle(),"com.citrolabs.ego.helper");}
}
