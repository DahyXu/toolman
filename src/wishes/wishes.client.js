(function () {
  var API = '/api/wishes';
  var COLORS = ['#ffe28a', '#ffc4d6', '#b9f0d6', '#bfe1ff', '#dccbff', '#ffd0a6'];
  var PAGE = 60;
  var HEART = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 20.3 4.6 13a4.8 4.8 0 0 1 6.8-6.8l.6.6.6-.6a4.8 4.8 0 1 1 6.8 6.8z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>';
  var CHECK = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="m4.5 10.5 3.6 3.6 7.4-8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var STAR = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M12 2.5l2.4 6.6 6.6 2.4-6.6 2.4L12 20.5l-2.4-6.6L3 11.5l6.6-2.4z" fill="currentColor"/></svg>';
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var wall = $('#ww');
  if (!wall) return;
  var ropes = $('#ropes');
  var form = $('#cmp');
  var ta = $('#wtext');
  var ctag = $('.ctag', form);
  var btn = $('.hang-btn', form);
  var msg = $('#wmsg');
  var cnt = $('#wcnt');

  var wishes = null;
  var sort = 'top';
  var shown = PAGE;
  var pinned = null;
  var color = Math.floor(Math.random() * COLORS.length);
  var mine = load('tm-wish-hearts');

  function load(k) {
    try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; }
  }
  function save(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }
  // Deterministic per-wish randomness, so a tag keeps its string length and
  // its swing from one render to the next.
  function rnd(id, salt) {
    var x = Math.sin(id * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  // ---- sky ----
  (function sky() {
    var s = $('.sky', wall);
    var html = '';
    for (var i = 0; i < 70; i++) {
      html += '<i class="star' + (Math.random() < 0.15 ? ' b' : '') + '" style="left:' + (Math.random() * 100).toFixed(2) +
        '%;top:' + (Math.random() * 100).toFixed(2) + '%;animation-delay:' + (Math.random() * 3).toFixed(2) +
        's;animation-duration:' + (2 + Math.random() * 3).toFixed(2) + 's"></i>';
    }
    s.insertAdjacentHTML('beforeend', html);
  })();

  // ---- composer ----
  function paintColor() {
    ctag.style.setProperty('--pc', COLORS[color]);
    [].forEach.call(form.querySelectorAll('.sw button'), function (b, i) {
      b.setAttribute('aria-checked', i === color ? 'true' : 'false');
      b.tabIndex = i === color ? 0 : -1;
    });
  }
  $('.sw', form).addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    color = +b.dataset.c;
    paintColor();
  });
  $('.sw', form).addEventListener('keydown', function (e) {
    var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    color = (color + d + COLORS.length) % COLORS.length;
    paintColor();
    form.querySelectorAll('.sw button')[color].focus();
  });
  paintColor();

  function count() {
    var n = Array.from(ta.value).length;
    cnt.textContent = n + '/80';
    cnt.classList.toggle('full', n >= 80);
  }
  ta.addEventListener('input', count);
  ta.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : btn.click(); }
  });
  count();

  var ERR = {
    'too-short': 'A few more words, please.',
    'too-long': 'Keep it under 80 characters.',
    'no-links': 'No links, just the idea.',
    'slow-down': 'That is a lot of wishes. Try again in a few minutes.',
    'unavailable': 'The wall is resting. Try again soon.'
  };
  function say(t, ok) {
    msg.textContent = t || '';
    msg.className = 'msg' + (ok ? ' ok' : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = ta.value.trim();
    if (Array.from(text).length < 3) { say(ERR['too-short']); shake(ctag); ta.focus(); return; }
    btn.disabled = true;
    say('');
    fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ op: 'add', text: text, color: color, website: form.website.value })
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        btn.disabled = false;
        if (!res.ok) { say(ERR[res.j.error] || 'Something went wrong.'); shake(ctag); return; }
        var w = res.j.wish;
        mine[w.id] = 1;
        save('tm-wish-hearts', mine);
        if (!wishes) wishes = [];
        var at = wishes.findIndex(function (x) { return x.id === w.id; });
        if (at >= 0) wishes[at] = w; else wishes.push(w);
        pinned = w.id;
        var from = ctag.getBoundingClientRect();
        var fromColor = COLORS[color];
        ta.value = '';
        count();
        render();
        flyIn(w.id, from, fromColor, res.j.merged);
        color = (color + 1) % COLORS.length;
        paintColor();
      })
      .catch(function () { btn.disabled = false; say('Could not reach the wall. Check your connection.'); shake(ctag); });
  });

  function shake(el) {
    if (still || !el.animate) return;
    el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' },
      { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 380 });
  }

  // ---- data ----
  function fetchWishes() {
    skeleton();
    fetch(API, { headers: { accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { wishes = j.wishes || []; render(); })
      .catch(oops);
  }

  function tally() {
    var list = wishes || [];
    $('#nW').textContent = list.length.toLocaleString();
    $('#nH').textContent = list.reduce(function (n, w) { return n + w.votes; }, 0).toLocaleString();
  }

  function ordered() {
    var list = wishes.slice();
    list.sort(sort === 'new'
      ? function (a, b) { return b.id - a.id; }
      : function (a, b) { return (b.status === 'done') - (a.status === 'done') || b.votes - a.votes || b.id - a.id; });
    if (pinned != null) {
      var i = list.findIndex(function (w) { return w.id === pinned; });
      if (i > 0) list.unshift(list.splice(i, 1)[0]);
    }
    return list;
  }

  // ---- layout ----
  function metrics() {
    var W = Math.max(ropes.clientWidth, 300);
    var narrow = W < 560;
    var slot = narrow ? 150 : 178;
    var n = Math.max(2, Math.floor((W - 12) / slot));
    return { W: W, n: n, tw: Math.min(narrow ? 136 : 150, Math.floor(W / n) - 14), sag: Math.min(30, W * 0.045) };
  }
  // y of the rope at x: a quadratic sag from both ends at y=12.
  function ropeY(x, m) {
    var t = x / m.W;
    return 12 + 4 * m.sag * t * (1 - t);
  }

  function ropeSvg(m) {
    var y0 = 12, mid = y0 + 2 * m.sag;
    var bulbs = '';
    var k = Math.max(4, Math.round(m.W / 46));
    var hues = ['#ffd66b', '#ff9bb8', '#8ff0c7', '#9cd2ff'];
    for (var i = 1; i < k; i++) {
      var x = (i / k) * m.W;
      var y = ropeY(x, m) + 4;
      bulbs += '<circle class="bulb" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3" fill="' + hues[i % 4] +
        '" style="animation-delay:' + ((i % 5) * 0.45).toFixed(2) + 's;filter:drop-shadow(0 0 5px ' + hues[i % 4] + ')"/>';
    }
    return '<svg width="' + m.W + '" height="' + (mid + 14) + '" aria-hidden="true"><path d="M0 ' + y0 + ' Q' + m.W / 2 + ' ' + mid + ' ' + m.W + ' ' + y0 +
      '" fill="none" stroke="#c89b62" stroke-width="2.4" stroke-linecap="round"/>' + bulbs + '</svg>';
  }

  function hangHtml(w, x, y, m, opts) {
    opts = opts || {};
    var len = Math.round(12 + rnd(w.id, 1) * 26);
    var d = (4.2 + rnd(w.id, 2) * 2.6).toFixed(2);
    var dl = (-rnd(w.id, 3) * 5).toFixed(2);
    var s = Math.min(1.32, 1 + (Math.max(1, w.votes) - 1) * 0.012);
    var on = !!mine[w.id];
    var cls = 'tag' + (w.votes >= 5 ? ' hot' : '') + (w.status === 'done' ? ' done' : '');
    var text = String(w.text).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
    return '<div class="hg' + (opts.cls ? ' ' + opts.cls : '') + '" role="listitem" data-id="' + w.id + '" style="left:' + x.toFixed(1) +
      'px;top:' + y.toFixed(1) + 'px;--w:' + m.tw + 'px;--len:' + len + 'px;--d:' + d + 's;--dl:' + dl + 's;--z:' + Math.min(40, w.votes) + '">' +
      '<i class="clip"></i><div class="' + cls + '" style="--pc:' + COLORS[w.color % COLORS.length] + ';--s:' + s.toFixed(3) + '">' +
      '<span class="hole"></span>' + (w.status === 'done' ? '<span class="stamp" title="Built">' + CHECK + '</span>' : '') +
      '<p class="wt">' + text + '</p><div class="tb"><button type="button" class="heart' + (on ? ' on' : '') + '" aria-pressed="' + on +
      '" aria-label="I want this too (' + w.votes + ')">' + HEART + '<span>' + w.votes + '</span></button></div></div></div>';
  }

  function row(items, m, builder) {
    var r = document.createElement('div');
    r.className = 'rope';
    var html = ropeSvg(m);
    for (var i = 0; i < items.length; i++) {
      var x = ((i + 0.5) / m.n) * m.W;
      html += builder(items[i], x, ropeY(x, m) + 2, m);
    }
    r.innerHTML = html;
    return r;
  }

  // Each rope is as tall as its longest tag, measured after it is in the page.
  function fit(r) {
    var bottom = 0;
    [].forEach.call(r.querySelectorAll('.hg'), function (h) {
      var t = h.querySelector('.tag');
      var s = parseFloat(t.style.getPropertyValue('--s')) || 1;
      bottom = Math.max(bottom, h.offsetTop + t.offsetTop + t.offsetHeight * s);
    });
    r.style.height = Math.ceil(bottom + 26) + 'px';
  }

  function render() {
    tally();
    var m = metrics();
    ropes.innerHTML = '';
    ropes.setAttribute('aria-busy', 'false');
    if (!wishes.length) {
      var ghosts = [];
      for (var g = 0; g < m.n; g++) ghosts.push(g);
      var r0 = row(ghosts, m, function (g, x, y, m) {
        return '<div class="hg ghost" style="left:' + x + 'px;top:' + y + 'px;--w:' + m.tw + 'px;--len:' + (14 + g * 7) + 'px;--dl:-' + g + 's">' +
          '<i class="clip"></i><div class="tag"><svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 2.5l2.4 6.6 6.6 2.4-6.6 2.4L12 20.5l-2.4-6.6L3 11.5l6.6-2.4z" fill="currentColor"/></svg></div></div>';
      });
      ropes.appendChild(r0);
      fit(r0);
      $('#wmore').hidden = true;
      return;
    }
    var list = ordered().slice(0, shown);
    var frag = document.createDocumentFragment();
    var made = [];
    for (var i = 0; i < list.length; i += m.n) {
      var r = row(list.slice(i, i + m.n), m, function (w, x, y, m) { return hangHtml(w, x, y, m, w.id === pinned ? { cls: 'new' } : null); });
      frag.appendChild(r);
      made.push(r);
    }
    ropes.appendChild(frag);
    made.forEach(fit);
    $('#wmore').hidden = wishes.length <= shown;
  }

  function skeleton() {
    var m = metrics();
    ropes.innerHTML = '';
    ropes.setAttribute('aria-busy', 'true');
    for (var k = 0; k < 2; k++) {
      var items = [];
      for (var i = 0; i < m.n; i++) items.push(i);
      var r = row(items, m, function (i, x, y, m) {
        return '<div class="hg skel" style="left:' + x + 'px;top:' + y + 'px;--w:' + m.tw + 'px;--len:' + (12 + ((i * 7 + k * 5) % 24)) + 'px;--dl:-' + i + 's"><i class="clip"></i><div class="tag"></div></div>';
      });
      ropes.appendChild(r);
      fit(r);
    }
  }

  function oops() {
    ropes.setAttribute('aria-busy', 'false');
    ropes.innerHTML = '<div class="oops"><svg viewBox="0 0 64 40" width="84" height="52" aria-hidden="true"><path d="M18 34a11 11 0 0 1-1.5-21.9A15 15 0 0 1 45 10a12 12 0 0 1 1 24z" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M26 22l4 4m0-4-4 4M38 22l4 4m0-4-4 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' +
      '<button type="button" id="wretry" aria-label="Try loading the wishes again"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M15.5 8A6 6 0 1 0 16 12M16 3.5V8h-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>';
    $('#wretry').addEventListener('click', fetchWishes);
  }

  // ---- motion ----
  function burst(x, y, n, colors, glyph) {
    if (still || !document.body.animate) return;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('div');
      p.className = 'spark';
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.color = colors[i % colors.length];
      p.innerHTML = glyph;
      document.body.appendChild(p);
      var a = (Math.PI * 2 * i) / n + Math.random() * 0.6;
      var dist = 30 + Math.random() * 40;
      var dx = Math.cos(a) * dist, dy = Math.sin(a) * dist - 26;
      p.animate([
        { transform: 'translate(0,0) scale(.4)', opacity: 1 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(1.1)', opacity: 1, offset: 0.6 },
        { transform: 'translate(' + dx * 1.2 + 'px,' + (dy - 18) + 'px) scale(.6)', opacity: 0 }
      ], { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = (function (el) { return function () { el.remove(); }; })(p);
    }
  }

  function flyIn(id, from, fromColor, merged) {
    var hg = ropes.querySelector('.hg[data-id="' + id + '"]');
    if (!hg) return;
    var tag = hg.querySelector('.tag');
    var done = function () {
      var b = tag.getBoundingClientRect();
      burst(b.left + b.width / 2, b.top + 8, 12, ['#ffe28a', '#ffffff', '#ffc4d6', '#b9f0d6'], STAR);
      if (merged) { var h = tag.querySelector('.heart'); h.classList.add('pop'); }
    };
    var to = tag.getBoundingClientRect();
    var visible = to.top < innerHeight && to.bottom > 0;
    if (!visible) hg.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' });
    if (still || !document.body.animate) { done(); return; }
    setTimeout(function () {
      to = tag.getBoundingClientRect();
      var clone = tag.cloneNode(true);
      clone.classList.add('fly');
      clone.style.setProperty('--pc', fromColor);
      clone.style.left = from.left + 'px';
      clone.style.top = from.top + 'px';
      clone.style.width = from.width + 'px';
      clone.style.height = from.height + 'px';
      clone.style.transform = 'none';
      clone.querySelector('.wt').style.fontSize = '18px';
      document.body.appendChild(clone);
      tag.style.visibility = 'hidden';
      var dx = to.left - from.left, dy = to.top - from.top;
      var sx = to.width / from.width, sy = to.height / from.height;
      var lift = Math.min(160, Math.abs(dy) * 0.5 + 60);
      clone.animate([
        { transform: 'translate(0,0) scale(1,1) rotate(0deg)', transformOrigin: '0 0' },
        { transform: 'translate(' + dx * 0.45 + 'px,' + (dy * 0.45 - lift) + 'px) scale(' + (1 + sx) / 2 + ',' + (1 + sy) / 2 + ') rotate(-10deg)', transformOrigin: '0 0', offset: 0.5 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ') rotate(0deg)', transformOrigin: '0 0' }
      ], { duration: 900, easing: 'cubic-bezier(.45,0,.25,1)' }).onfinish = function () {
        clone.remove();
        tag.style.visibility = '';
        hg.classList.add('land');
        hg.addEventListener('animationend', function f() { hg.classList.remove('land'); hg.removeEventListener('animationend', f); });
        done();
      };
    }, visible ? 0 : 450);
  }

  // ---- hearts ----
  ropes.addEventListener('click', function (e) {
    var b = e.target.closest('.heart');
    if (!b) return;
    var hg = b.closest('.hg');
    var id = +hg.dataset.id;
    var w = wishes.find(function (x) { return x.id === id; });
    if (!w) return;
    var r = b.getBoundingClientRect();
    b.classList.remove('pop');
    void b.offsetWidth;
    b.classList.add('pop');
    burst(r.left + r.width / 2, r.top + r.height / 2, 7, ['#ff5c8a', '#ff9bb8', '#ffd0dc'], HEART);
    if (mine[id]) return; // already counted; the burst is its own reward
    mine[id] = 1;
    save('tm-wish-hearts', mine);
    w.votes += 1;
    update(b, w);
    fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ op: 'vote', id: id }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (typeof j.votes === 'number') { w.votes = j.votes; update(b, w); } })
      .catch(function () {});
  });
  function update(b, w) {
    b.classList.add('on');
    b.setAttribute('aria-pressed', 'true');
    b.setAttribute('aria-label', 'I want this too (' + w.votes + ')');
    b.querySelector('span').textContent = w.votes;
    var t = b.closest('.tag');
    t.style.setProperty('--s', Math.min(1.32, 1 + (w.votes - 1) * 0.012).toFixed(3));
    t.classList.toggle('hot', w.votes >= 5);
    tally();
  }

  // ---- sort / more / resize ----
  $('.sort', wall).addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.dataset.sort === sort) return;
    sort = b.dataset.sort;
    pinned = null;
    [].forEach.call(this.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    if (wishes) render();
  });
  $('#wmore button').addEventListener('click', function () { shown += PAGE; render(); });
  // Redraw whenever the wall itself changes width. Watching the wall rather
  // than the window also catches a page laid out while hidden, where the first
  // measurement is zero and every tag would land on a rope a few pixels long.
  var lastW = ropes.clientWidth, t;
  function relayout() {
    clearTimeout(t);
    t = setTimeout(function () {
      var w = ropes.clientWidth;
      if (w === lastW || w < 120) return;
      lastW = w;
      if (wishes) render(); else skeleton();
    }, 120);
  }
  if (window.ResizeObserver) new ResizeObserver(relayout).observe(ropes);
  else addEventListener('resize', relayout);
  fetchWishes();
})();
