import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../src-tauri/src/qqmusic-page.js',import.meta.url),'utf8');
function fixture(){
 const f={now:0,playing:false,mid:'003nYgF01aN0yF',duration:'03:35',callback:null};
 const bar={style:{width:'10%'}};
 const nodes={'.player_progress:not(.player_voice)':{querySelector:()=>bar},'.btn_big_play':{classList:{contains:()=>f.playing}},'.song_info__name a':{getAttribute:()=>`/n/ryqq_v2/songDetail/${f.mid}?`,textContent:'月亮代表我的心'},'.player_music__time':{get textContent(){return `00:21 / ${f.duration}`;}},'.song_info__album a':{textContent:'歌曲精选80首'},'.song_info__pic':{src:'https://y.qq.com/cover.jpg'}};
 const context=vm.createContext({location:{hostname:'y.qq.com',pathname:'/n/ryqq_v2/player'},window:{},document:{querySelector:s=>nodes[s],querySelectorAll:()=>[{textContent:'邓丽君'}]},performance:{now:()=>f.now},MutationObserver:class{constructor(cb){f.callback=cb;}observe(){}disconnect(){}}});
 return {f,bar,nodes,context,read:()=>JSON.parse(vm.runInContext(script,context)||'null')};
}
test('reads official QQ visible metadata and paused position',()=>{const x=fixture(),p=x.read();assert.equal(p.name,'月亮代表我的心');assert.equal(p.artist,'邓丽君');assert.equal(p.mid,x.f.mid);assert.equal(p.position,21.5);assert.equal(p.playing,false);assert.equal(p.clock,'page_progress');});
test('interpolates moving progress and stops advancing while stalled or paused',()=>{const x=fixture();x.read();x.f.playing=true;x.f.now=1000;x.bar.style.width='11%';x.f.callback();x.f.now=1200;assert.ok(Math.abs(x.read().position-23.85)<.00001);x.f.now=5000;const stalled=x.read();assert.equal(stalled.playing,false);assert.ok(stalled.position<=24.9);x.f.playing=false;assert.equal(x.read().position,23.65);});
test('new songs reset timing and foreign pages are ignored',()=>{const x=fixture();x.read();x.f.mid='newSong';x.bar.style.width='0%';assert.equal(x.read().position,0);x.context.location.hostname='evil.example';assert.equal(x.read(),null);x.context.location.hostname='y.qq.com';x.context.location.pathname='/n/ryqq_v2/player-evil';assert.equal(x.read(),null);});

test('reports QQ autoplay confirmation instead of a misleading paused connection',()=>{const x=fixture();x.nodes['[role=dialog]']={textContent:'QQ音乐提醒您：音乐无法自动播放，请手动点击播放。开始播放'};assert.equal(x.read().status,'autoplay_required');delete x.nodes['[role=dialog]'];assert.equal(x.read().status,'ready');});
test('ignores other dialogs and tolerates a song link not ready yet',()=>{const x=fixture();x.nodes['[role=dialog]']={textContent:'设置'};assert.equal(x.read().status,'ready');x.nodes['.song_info__name a'].getAttribute=()=>null;assert.equal(x.read().status,'not_ready');});
