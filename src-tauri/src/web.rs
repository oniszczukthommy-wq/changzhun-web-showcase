//! Local browser transport for the original native engine. No LAN listener or remote service.
use std::{io::{BufRead, BufReader, Read, Write}, net::{TcpListener, TcpStream}, sync::{Mutex, OnceLock, mpsc::{sync_channel, SyncSender}}, time::{Duration, SystemTime, UNIX_EPOCH}};
use serde_json::{json, Value};
use tauri::Manager;
#[path = "web_dispatch.rs"] mod commands;
pub const PORT: u16 = 47322;
const HOST: &str = "127.0.0.1:47322";
const ORIGIN: &str = "http://127.0.0.1:47322";
static TOKEN: OnceLock<String> = OnceLock::new();
static CLIENTS: Mutex<Vec<SyncSender<(String, f64)>>> = Mutex::new(Vec::new());
pub fn enabled() -> bool { true }
pub fn open_browser() { let _ = std::process::Command::new("open").arg(ORIGIN).spawn(); }
pub fn send(ev: &Value) {
    if TOKEN.get().is_none() { return; }
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs_f64()*1000.0;
    let text = ev.to_string();
    CLIENTS.lock().unwrap_or_else(|e|e.into_inner()).retain(|tx|tx.try_send((text.clone(),now)).is_ok());
}
pub fn start(app: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let server = match TcpListener::bind(("127.0.0.1",PORT)) {
        Ok(s) => s,
        Err(e) => { return Err(format!("唱准助手无法启动，本地端口 {PORT} 已占用：{e}").into()); }
    };
    let mut bytes=[0u8;32]; std::fs::File::open("/dev/urandom")?.read_exact(&mut bytes)?;
    let _=TOKEN.set(bytes.iter().map(|b|format!("{b:02x}")).collect());
    std::thread::spawn(move || { for socket in server.incoming().flatten() {
        let app=app.clone(); std::thread::spawn(move ||{let _=serve(socket,&app);});
    }});
    crate::engine::log(&format!("唱准网页：{ORIGIN}"));
    if std::env::var("CHANGZHUN_NO_OPEN").as_deref()!=Ok("1") { open_browser(); }
    Ok(())
}
fn allowed_request(host: &str, origin: Option<&str>, site: Option<&str>) -> bool {
    host==HOST && origin.map_or(true,|o|o==ORIGIN) && !matches!(site,Some("cross-site"))
}
fn token_ok(token: &str) -> bool { TOKEN.get().is_some_and(|t|!token.is_empty() && t==token) }
fn serve(mut socket: TcpStream, app: &tauri::AppHandle) -> std::io::Result<()> {
    socket.set_nodelay(true)?; socket.set_read_timeout(Some(Duration::from_secs(10)))?;socket.set_write_timeout(Some(Duration::from_secs(10)))?;
    let mut reader=BufReader::new(socket.try_clone()?);
    let mut request=String::new(); reader.by_ref().take(8192).read_line(&mut request)?;
    let parts:Vec<_>=request.split_whitespace().collect();
    if parts.len()!=3 { return reply(&mut socket,400,"text/plain",b"bad request"); }
    let (method,target)=(parts[0],parts[1]);
    let mut headers=std::collections::HashMap::new(); let mut count=request.len();
    loop {
        let mut h=String::new();let n=reader.read_line(&mut h)?;count+=n;
        if count>16384 { return reply(&mut socket,431,"text/plain",b"headers too large"); }
        if n==0 || h.trim().is_empty(){break;}
        if let Some((k,v))=h.split_once(':'){headers.insert(k.trim().to_ascii_lowercase(),v.trim().to_string());}
    }
    let header=|k:&str|headers.get(k).map(String::as_str);
    if !allowed_request(header("host").unwrap_or(""),header("origin"),header("sec-fetch-site")) {return reply(&mut socket,403,"text/plain",b"local origin required");}
    let (path,query)=target.split_once('?').unwrap_or((target,""));
    let q:std::collections::HashMap<_,_>=query.split('&').filter_map(|p|p.split_once('=')).map(|(k,v)|(k,urlencoding::decode(v).unwrap_or_default().into_owned())).collect();
    let token=q.get("token").map(String::as_str).unwrap_or("");
    if path=="/api/invoke" && method=="POST" {
        if header("origin")!=Some(ORIGIN) || !token_ok(header("x-changzhun-token").unwrap_or("")) || header("content-type")!=Some("application/json") {return reply(&mut socket,403,"application/json",br#"{"error":"unauthorized"}"#);}
        let len=header("content-length").and_then(|x|x.parse::<usize>().ok()).unwrap_or(0);
        if len==0 || len>262144 {return reply(&mut socket,413,"text/plain",b"invalid body length");}
        let mut body=vec![0;len];reader.read_exact(&mut body)?;
        let input:Value=match serde_json::from_slice(&body){Ok(v)=>v,Err(_)=>return reply(&mut socket,400,"application/json",br#"{"error":"invalid JSON"}"#)};
        let cmd=input["command"].as_str().unwrap_or("");
        let result=commands::dispatch(app,cmd,input["args"].clone());
        let (code,value)=match result{Ok(v)=>(200,json!({"result":v})),Err(e)=>(400,json!({"error":e}))};
        return reply(&mut socket,code,"application/json",value.to_string().as_bytes());
    }
    if method!="GET" && method!="HEAD" {return reply(&mut socket,405,"text/plain",b"method not allowed");}
    if path=="/events" {
        if !token_ok(token){return reply(&mut socket,403,"text/plain",b"unauthorized");}
        return events(socket);
    }
    if path=="/api/audio" {
        if !token_ok(token){return reply(&mut socket,403,"text/plain",b"unauthorized");}
        let store=app.state::<crate::store::Store>();
        if let Some(p)=q.get("id").and_then(|id|store.take_dir(id)).and_then(|d|crate::takeaudio::recording(&d)) {
            if let Ok(body)=std::fs::read(&p){return audio_reply(&mut socket,crate::takeaudio::mime(&p),&body,header("range"),method=="HEAD");}
        }
        return reply(&mut socket,404,"text/plain",b"recording not found");
    }
    if path=="/api/health" {return reply(&mut socket,200,"application/json",br#"{"ok":true,"app":"changzhun","version":1}"#);}
    if path.starts_with("/api/") {return reply(&mut socket,404,"text/plain",b"not found");}
    let decoded=urlencoding::decode(path).unwrap_or_default();
    if decoded.split('/').any(|p|p=="..") || decoded.contains('\\') {return reply(&mut socket,400,"text/plain",b"invalid path");}
    let asset=if path=="/" {"/index.html".to_string()} else if !path.rsplit('/').next().unwrap_or("").contains('.') {format!("{}.html",path.trim_end_matches('/'))} else{path.to_string()};
    if let Some(a)=app.asset_resolver().get(asset) {
        let mut body=a.bytes().to_vec();
        if a.mime_type().starts_with("text/html") {
            let boot=format!("<head><script>window.__CHANGZHUN_WEB__={{token:{}}};</script>",serde_json::to_string(TOKEN.get().unwrap()).unwrap());
            body=String::from_utf8_lossy(&body).replacen("<head>",&boot,1).into_bytes();
        }
        return reply(&mut socket,200,a.mime_type(),&body);
    }
    reply(&mut socket,404,"text/plain",b"not found")
}
/// Single HTTP byte ranges let Safari and Chromium seek in a recorded take.
fn byte_range(range: &str, len: usize) -> Option<(usize, usize)> {
    let (a,b)=range.strip_prefix("bytes=")?.split_once('-')?;
    if len==0 || b.contains(',') { return None; }
    if a.is_empty() {
        let count=b.parse::<usize>().ok()?;
        return (count>0).then_some((len.saturating_sub(count),len-1));
    }
    let start=a.parse::<usize>().ok()?;
    let end=if b.is_empty(){len-1}else{b.parse::<usize>().ok()?.min(len-1)};
    (start<len && end>=start).then_some((start,end))
}
fn audio_reply(socket:&mut TcpStream,mime:&str,body:&[u8],range:Option<&str>,head:bool)->std::io::Result<()> {
    let len=body.len();
    let (code,span,extra)=if let Some(r)=range {
        match byte_range(r,len) {
            Some((a,b))=>("206 Partial Content",&body[a..=b],format!("Content-Range: bytes {a}-{b}/{len}\r\n")),
            None=>("416 Range Not Satisfiable",&body[..0],format!("Content-Range: bytes */{len}\r\n")),
        }
    }else{("200 OK",body,String::new())};
    write!(socket,"HTTP/1.1 {code}\r\nContent-Type: {mime}\r\nContent-Length: {}\r\nAccept-Ranges: bytes\r\n{extra}Cache-Control: no-store\r\nCross-Origin-Resource-Policy: same-origin\r\nConnection: close\r\n\r\n",span.len())?;
    if !head {socket.write_all(span)?;}
    socket.flush()
}
fn reply(socket:&mut TcpStream,code:u16,mime:&str,body:&[u8])->std::io::Result<()> {
    let name=match code{200=>"OK",400=>"Bad Request",403=>"Forbidden",404=>"Not Found",405=>"Method Not Allowed",413=>"Payload Too Large",_=>"Error"};
    write!(socket,"HTTP/1.1 {code} {name}\r\nContent-Type: {mime}\r\nContent-Length: {}\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nX-Frame-Options: DENY\r\nCross-Origin-Resource-Policy: same-origin\r\nConnection: close\r\n\r\n",body.len())?;
    socket.write_all(body)?;socket.flush()
}
fn events(mut socket:TcpStream)->std::io::Result<()> {
    let(tx,rx)=sync_channel(256);CLIENTS.lock().unwrap_or_else(|e|e.into_inner()).push(tx);
    write!(socket,"HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nCache-Control: no-store\r\nConnection: keep-alive\r\nCross-Origin-Resource-Policy: same-origin\r\n\r\nretry: 1000\n\n")?;
    for ev in crate::engine::catch_up(){write!(socket,"id: 0\ndata: {ev}\n\n")?;}
    write!(socket,"event: mirror\ndata: {{\"caught_up\":true}}\n\n")?;
    loop {match rx.recv_timeout(Duration::from_secs(10)){
        Ok((text,at))=>write!(socket,"id: {at:.3}\ndata: {text}\n\n")?,
        Err(std::sync::mpsc::RecvTimeoutError::Timeout)=>write!(socket,": heartbeat\n\n")?,
        Err(_)=>return Ok(())
    }}
}
#[cfg(test)] mod tests {
    use super::*;
    #[test] fn browser_audio_ranges(){
        assert_eq!(byte_range("bytes=0-1",100),Some((0,1)));
        assert_eq!(byte_range("bytes=50-",100),Some((50,99)));
        assert_eq!(byte_range("bytes=-10",100),Some((90,99)));
        assert_eq!(byte_range("bytes=0-999",100),Some((0,99)));
        for r in ["bytes=100-", "bytes=5-4", "bytes=-0", "bytes=0-1,4-5", "items=0-1"] { assert_eq!(byte_range(r,100),None); }
        assert_eq!(byte_range("bytes=0-",0),None);
    }
    #[test] fn reject_external_origin_and_rebinding(){
        assert!(allowed_request(HOST,Some(ORIGIN),Some("same-origin")));
        assert!(!allowed_request("evil.example:47322",Some(ORIGIN),None));
        assert!(!allowed_request(HOST,Some("https://evil.example"),None));
        assert!(!allowed_request(HOST,None,Some("cross-site")));
    }
}
