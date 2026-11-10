(function () {
  if (location.hostname !== 'y.qq.com' || !/^\/n\/ryqq(?:_v2)?\/player\/?$/.test(location.pathname)) return '';
  const dialog = document.querySelector('[role=dialog]');
  if (dialog && /音乐无法自动播放|请手动点击播放/.test(dialog.textContent || '')) return JSON.stringify({status:'autoplay_required'});
  window.__changzhunQQTab ||= 'cz' + Math.random().toString(36).slice(2);
  const root = document.querySelector('.player_progress:not(.player_voice)');
  const bar = root && root.querySelector('.player_progress__play');
  const button = document.querySelector('.btn_big_play');
  const title = document.querySelector('.song_info__name a');
  const match = title && (title.getAttribute('href') || '').match(/\/songDetail\/([A-Za-z0-9]+)/);
  if (!bar || !button || !title || !match) return JSON.stringify({ status: 'not_ready' });
  const seconds = text => text.trim().split(':').reduce((n, x) => n * 60 + Number(x), 0);
  const time = document.querySelector('.player_music__time');
  const parts = time ? time.textContent.split('/') : [];
  const duration = parts.length === 2 ? seconds(parts[1]) : 0;
  if (!Number.isFinite(duration) || duration <= 0) return JSON.stringify({ status: 'not_ready' });
  const mid = match[1];
  let clock = window.__changzhunQQClock;
  if (!clock || clock.bar !== bar || clock.mid !== mid || clock.duration !== duration) {
    if (clock && clock.observer) clock.observer.disconnect();
    clock = window.__changzhunQQClock = { bar, mid, duration, percent: NaN, at: performance.now(), moving: false, anchored: false };
    const update = () => {
      const percent = parseFloat(bar.style.width);
      if (Number.isFinite(percent) && percent !== clock.percent) {
        clock.anchored = Number.isFinite(clock.percent);
        clock.percent = percent; clock.at = performance.now();
      }
    };
    clock.observer = new MutationObserver(update);
    clock.observer.observe(bar, { attributes: true, attributeFilter: ['style'] });
    update();
  }
  const moving = button.classList.contains('btn_big_play--pause');
  if (!moving) { clock.anchored = false; clock.at = performance.now(); }
  const age = Math.max(0, (performance.now() - clock.at) / 1000);
  const base = Number.isFinite(clock.percent) ? duration * clock.percent / 100 : seconds(parts[0]);
  const position = Math.max(0, Math.min(duration, base + (moving && clock.anchored ? Math.min(age, 1.25) : 0)));
  const art = document.querySelector('.song_info__pic');
  return JSON.stringify({ status: 'ready', tab: window.__changzhunQQTab, mid, name: title.textContent.trim(),
    artist: Array.from(document.querySelectorAll('.song_info__singer a')).map(a => a.textContent.trim()).join(' / '),
    album: document.querySelector('.song_info__album a')?.textContent.trim() || '',
    art: art?.src || '', duration, position, playing: moving && (!clock.anchored || age < 2.5), clock: 'page_progress' });
})()
