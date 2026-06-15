/*
  crash smp — main.js
  scris de non name

  am organizat totul in clase ca sa fie mai usor de modificat
  daca strici ceva si nu stii de ce, uita-te in consola

  staff-ul se incarca din data/staff.json
  API-ul pentru stats e mcsrvstat.us, gratuit, nu necesita auth
*/

'use strict';

// ---------------------------------------------------------------
// ParticleField — punctele care plutesc in fundal + liniile dintre ele
// dezactivat pe telefoane ca sa nu laghe
// ---------------------------------------------------------------

class ParticleField {
  constructor(idCanvas) {
    this.canvas = document.getElementById(idCanvas);
    if (!this.canvas) return;

    this.ctx   = this.canvas.getContext('2d');
    this.dpr   = Math.min(window.devicePixelRatio || 1, 2);
    this.mobil = window.innerWidth < 720 || ('ontouchstart' in window);
    this.activ = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.particule = [];

    this._resize = this._resize.bind(this);
    this._loop   = this._loop.bind(this);

    window.addEventListener('resize', this._resize, { passive: true });

    document.addEventListener('visibilitychange', () => {
      this.activ = !document.hidden &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (this.activ) requestAnimationFrame(this._loop);
    });

    this._resize();
    if (this.activ) requestAnimationFrame(this._loop);
  }

  _resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width  = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.mobil = this.w < 720;
    this._spawn();
  }

  _spawn() {
    const max = this.mobil ? 40 : 80;
    const n   = Math.min(max, Math.floor(this.w * this.h * 0.00006));
    this.particule = Array.from({ length: n }, () => ({
      x:   Math.random() * this.w,
      y:   Math.random() * this.h,
      vx:  (Math.random() - .5) * (this.mobil ? .18 : .28),
      vy:  (Math.random() - .5) * (this.mobil ? .18 : .28),
      r:   .7 + Math.random() * 1.7,
      hue: 287 + Math.random() * 34,
      a:   .18 + Math.random() * .48,
    }));
  }

  _linii() {
    if (this.mobil) return;
    const DIST = 115;
    const ctx  = this.ctx;
    const p    = this.particule;

    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        const dx = p[i].x - p[j].x;
        const dy = p[i].y - p[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d >= DIST) continue;

        ctx.strokeStyle = `hsla(293, 74%, 54%, ${(1 - d / DIST) * .09})`;
        ctx.lineWidth   = .6;
        ctx.beginPath();
        ctx.moveTo(p[i].x, p[i].y);
        ctx.lineTo(p[j].x, p[j].y);
        ctx.stroke();
      }
    }
  }

  _loop() {
    if (!this.activ) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    this._linii();

    for (const p of this.particule) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -4)         p.x = this.w + 4;
      if (p.x > this.w + 4) p.x = -4;
      if (p.y < -4)         p.y = this.h + 4;
      if (p.y > this.h + 4) p.y = -4;

      ctx.fillStyle = `hsla(${p.hue}, 76%, 64%, ${p.a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(this._loop);
  }
}


// ---------------------------------------------------------------
// RevealLaScroll — elementele apar cand dai scroll
// delay in cascada pe copiii din acelasi parinte
// ---------------------------------------------------------------

class RevealLaScroll {
  constructor(selector) {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll(selector).forEach(el => el.classList.add('reveal', 'vizibil'));
      return;
    }

    document.querySelectorAll(selector).forEach(el => el.classList.add('reveal'));

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const frati = [...e.target.parentElement.children]
          .filter(c => c.classList.contains('reveal'));
        const idx = frati.indexOf(e.target);
        e.target.style.transitionDelay = `${idx * 0.075}s`;
        e.target.classList.add('vizibil');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.08 });

    document.querySelectorAll(selector).forEach(el => obs.observe(el));
  }
}


// ---------------------------------------------------------------
// Toast — mesajul mic din colt
// ---------------------------------------------------------------

const Toast = {
  el: null, timer: null,

  _init() {
    this.el = document.createElement('div');
    this.el.className = 'toast';
    document.body.append(this.el);
  },

  arata(mesaj) {
    if (!this.el) this._init();
    this.el.textContent = '✓ ' + mesaj;
    this.el.classList.add('vizibil');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.el.classList.remove('vizibil'), 2300);
  }
};


// ---------------------------------------------------------------
// CopyChip — copiaza IP la click
// ---------------------------------------------------------------

class CopyChip {
  constructor(chipId, icoId, text) {
    this.chip = document.getElementById(chipId);
    this.ico  = document.getElementById(icoId);
    this.text = text;
    if (!this.chip) return;

    this.chip.addEventListener('click', () => this._copiaza());
    this.chip.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._copiaza(); }
    });
  }

  async _copiaza() {
    try {
      await navigator.clipboard.writeText(this.text);
    } catch {
      const inp = document.createElement('input');
      inp.value = this.text;
      inp.style.cssText = 'position:fixed;opacity:0';
      document.body.append(inp); inp.select(); document.execCommand('copy'); inp.remove();
    }

    if (this.ico) { this.ico.textContent = '✓'; this.ico.style.color = '#D532D7'; }
    this.chip.classList.add('copiat');
    Toast.arata('Copiat: ' + this.text);

    setTimeout(() => {
      if (this.ico) { this.ico.textContent = '⧉'; this.ico.style.color = ''; }
      this.chip.classList.remove('copiat');
    }, 2100);
  }
}


// ---------------------------------------------------------------
// GlowCard — glow care urmareste cursorul pe .card
// setat --mx si --my din JS, folosit in CSS cu radial-gradient
// ---------------------------------------------------------------

class GlowCard {
  constructor(selector) {
    if ('ontouchstart' in window) return;

    document.querySelectorAll(selector).forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }
}


// ---------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------

class Navbar {
  constructor() {
    this.nav    = document.getElementById('navbar');
    this.burger = document.getElementById('burger');
    this.meniu  = document.getElementById('meniu-mobil');
    if (!this.nav) return;

    const upd = () => this.nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', upd, { passive: true });
    upd();

    this.burger?.addEventListener('click', () => this._toggle());
    this.meniu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => this._inchide()));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this._inchide(); });
    document.addEventListener('click', e => {
      if (this._inchis()) return;
      if (!this.meniu.contains(e.target) && !this.burger.contains(e.target)) this._inchide();
    });
  }

  _inchis()  { return !this.meniu?.classList.contains('deschis'); }

  _toggle() {
    const d = this.meniu.classList.toggle('deschis');
    this.burger.classList.toggle('deschis', d);
    this.burger.setAttribute('aria-expanded', String(d));
    document.body.style.overflow = d ? 'hidden' : '';
  }

  _inchide() {
    this.meniu?.classList.remove('deschis');
    this.burger?.classList.remove('deschis');
    this.burger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
}


// ---------------------------------------------------------------
// ModalStaff — profil detaliat la click pe un membru
// suporta: click, tastatura, swipe-down, Escape, backdrop
// datele vin din JSON prin Staff.setDate()
// ---------------------------------------------------------------

class ModalStaff {
  constructor() {
    this.date    = {};
    this.overlay = document.getElementById('modal-overlay');
    this.modal   = document.getElementById('modal');
    this.btnInch = document.getElementById('modal-inchide');
    if (!this.overlay) return;

    this.btnInch.addEventListener('click', () => this._inchide());
    this.overlay.addEventListener('click', e => { if (e.target === this.overlay) this._inchide(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.overlay.classList.contains('activ')) this._inchide();
    });

    let yStart = 0;
    this.modal.addEventListener('touchstart', e => { yStart = e.touches[0].clientY; }, { passive: true });
    this.modal.addEventListener('touchend', e => {
      if (e.changedTouches[0].clientY - yStart > 55) this._inchide();
    }, { passive: true });

    // event delegation — funcționeaza si pe carduri adaugate dinamic
    document.addEventListener('click', e => {
      const card = e.target.closest('[data-staff]');
      if (!card) return;
      this._ripple(card, e);
      this._deschide(card.dataset.staff);
    });

    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = document.activeElement?.closest('[data-staff]');
      if (!card) return;
      e.preventDefault();
      this._deschide(card.dataset.staff);
    });
  }

  setDate(data) { this.date = data; }

  _ripple(card, e) {
    const r  = card.getBoundingClientRect();
    const sz = Math.max(r.width, r.height) * 2;
    const x  = (e.clientX || r.left + r.width  / 2) - r.left - sz / 2;
    const y  = (e.clientY || r.top  + r.height / 2) - r.top  - sz / 2;
    const el = document.createElement('div');
    el.className = 'ripple-el';
    el.style.cssText = `width:${sz}px;height:${sz}px;left:${x}px;top:${y}px`;
    card.append(el);
    setTimeout(() => el.remove(), 600);
  }

  _deschide(id) {
    const d = this.date[id];
    if (!d) return;

    document.getElementById('modal-av').textContent = d.litera;
    document.getElementById('modal-nm').textContent = d.name;
    document.getElementById('modal-rl').textContent = d.role;
    document.getElementById('modal-desc').innerHTML = d.desc;

    document.getElementById('modal-taguri').innerHTML =
      (d.taguri || []).map(t => `<span class="modal-tag">${_esc(t)}</span>`).join('');

    document.getElementById('modal-stats').innerHTML =
      (d.stats || []).map(s => `
        <div class="modal-stat">
          <div class="modal-stat-nr">${_esc(s.nr)}</div>
          <div class="modal-stat-text">${_esc(s.text)}</div>
        </div>`).join('');

    this.overlay.classList.add('activ');
    document.body.style.overflow = 'hidden';
    this.btnInch.focus();
  }

  _inchide() {
    this.overlay.classList.remove('activ');
    document.body.style.overflow = '';
  }
}


// ---------------------------------------------------------------
// Staff — incarca JSON, randeaza carduri, trimite date la modal
// ---------------------------------------------------------------

class Staff {
  constructor(containerId, modal) {
    this.container = document.getElementById(containerId);
    this.modal     = modal;
    if (!this.container) return;
    this._load();
  }

  async _load() {
    try {
      const r = await fetch('data/staff.json');
      if (!r.ok) throw 0;
      const data = await r.json();
      this._render(data);
    } catch {
      this.container.innerHTML =
        '<p style="color:var(--gri);padding:30px 0">Staff indisponibil momentan.</p>';
    }
  }

  _render(data) {
    if (!data?.groups?.length) return;
    this.container.innerHTML = '';

    const dateModal = {};

    data.groups.forEach(group => {
      const header = document.createElement('div');
      header.className = 'grup-titlu';
      header.innerHTML = `<span class="rol-badge ${_esc(group.badgeClass || 'rol-c')}">${_esc(group.badge)}</span>`;
      this.container.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'grid grid-3';

      group.members.forEach(m => {
        dateModal[m.id] = m;

        const avClass  = m.avatarClass ? `avatar ${_esc(m.avatarClass)}` : 'avatar';
        const rolClass = m.rolClass    ? `rol-text ${_esc(m.rolClass)}`  : 'rol-text';

        const art = document.createElement('article');
        art.className = 'membru';
        art.dataset.staff = m.id;
        art.tabIndex = 0;
        art.setAttribute('role', 'button');
        art.setAttribute('aria-label', `Profil ${_esc(m.name)}`);
        art.innerHTML = `
          <div class="${avClass}">${_esc(m.litera)}</div>
          <span class="nick">${_esc(m.name)}</span>
          <span class="${rolClass}">${_esc(m.role)}</span>
          <span class="bio">${_esc(m.bio)}</span>
          <span class="vezi-profil">Vezi profil →</span>`;

        grid.appendChild(art);
      });

      this.container.appendChild(grid);
    });

    this.modal.setDate(dateModal);
    _revealNoi(this.container);
  }
}


// ---------------------------------------------------------------
// StatsLive — ping + jucatori de la mcsrvstat.us
// se refresh la 60s
// ---------------------------------------------------------------

class StatsLive {
  constructor() {
    this.elPing  = document.getElementById('stat-ping');
    this.elJuc   = document.getElementById('stat-jucatori');
    if (!this.elPing) return;

    this.elPing.textContent = '...';
    this.elJuc.textContent  = '...';

    this._fetch();
    setInterval(() => this._fetch(), 60_000);
  }

  async _fetch() {
    const t0 = performance.now();
    try {
      const r    = await fetch('https://api.mcsrvstat.us/2/crashsmp.ro', { cache: 'no-store' });
      const ms   = Math.round(performance.now() - t0);
      const date = await r.json();

      this._nr(this.elPing, ms, 'ms', 850);

      if (date.online) {
        const on  = date.players?.online ?? 0;
        const max = date.players?.max    ?? '?';
        this._nr(this.elJuc, on, `/${max}`, 650);
      } else {
        this.elJuc.textContent = 'Offline';
      }
    } catch {
      const ms = Math.round(performance.now() - t0);
      this._nr(this.elPing, ms, 'ms', 700);
      this.elJuc.textContent = '—';
    }
  }

  _nr(el, target, sufix, dur) {
    const start = performance.now();
    const step  = now => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + sufix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}


// ---------------------------------------------------------------
// KonamiCode — ↑ ↑ ↓ ↓ ← → ← → B A
// ---------------------------------------------------------------

class KonamiCode {
  constructor(cb) {
    const seq = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    const buf = [];
    document.addEventListener('keydown', e => {
      buf.push(e.keyCode);
      if (buf.length > seq.length) buf.shift();
      if (buf.join(',') === seq.join(',')) cb();
    });
  }
}


// ---------------------------------------------------------------
// utilitare
// ---------------------------------------------------------------

function _esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _revealNoi(container) {
  if (!('IntersectionObserver' in window)) {
    container.querySelectorAll('.grup-titlu, .membru').forEach(el => {
      el.classList.add('reveal', 'vizibil');
    });
    return;
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const frati = [...e.target.parentElement.children]
        .filter(c => c.classList.contains('reveal'));
      const idx = frati.indexOf(e.target);
      e.target.style.transitionDelay = `${idx * 0.075}s`;
      e.target.classList.add('vizibil');
      obs.unobserve(e.target);
    });
  }, { threshold: 0.08 });

  container.querySelectorAll('.grup-titlu, .membru').forEach(el => {
    el.classList.add('reveal');
    obs.observe(el);
  });
}


// ---------------------------------------------------------------
// init
// ---------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  const IP = 'crashsmp.ro';

  new ParticleField('particles');
  new Navbar();
  new GlowCard('.card');

  new RevealLaScroll([
    'section .eticheta',
    'section h2',
    'section .desc-sectiune',
    '.card',
    '.stat-item',
    '.conectare-chipuri',
    '.final-text',
  ].join(', '));

  const modal = new ModalStaff();
  new Staff('staff-container', modal);

  new CopyChip('chip-ip',  'ico-ip',  IP);
  new CopyChip('chip-ip2', 'ico-ip2', IP);

  new StatsLive();

  const easter = document.getElementById('easter');
  new KonamiCode(() => {
    easter?.classList.add('activ');
    setTimeout(() => easter?.classList.remove('activ'), 3400);
  });

  document.getElementById('yr').textContent = new Date().getFullYear();

  console.log('%cCrash SMP — online ⚡', 'color:#D532D7;font-weight:700;font-size:13px;');
  console.log('%cnon name · High Developer & Web Developer', 'color:#a090b8;font-size:11px;');
  console.log('%c↑ ↑ ↓ ↓ ← → ← → B A', 'color:#a090b8;font-size:10px;font-style:italic;');
});
