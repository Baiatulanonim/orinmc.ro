/* ============================================================
   CRASH SMP — main.js
   Vanilla JS, no dependencies.
   Module: IIFE-uri izolate pentru fiecare funcționalitate.
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────
   1. PARTICULE CANVAS — fundal animat în hero
   ────────────────────────────────────────────────────────── */
(function ParticleSystem() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx   = canvas.getContext('2d');
  let W, H, rafId;
  let particles = [];

  const CFG = {
    count:        75,
    colors:       ['#D532D7', '#99018F', '#E870E8', '#f590f5', 'rgba(255,255,255,0.7)'],
    minR:         0.6,
    maxR:         2.4,
    speed:        0.28,
    connectDist:  110,
    connectAlpha: 0.13,
  };

  /* Redimensionare canvas la schimbare viewport */
  function resize() {
    const parent = canvas.parentElement;
    W = canvas.width  = parent.offsetWidth;
    H = canvas.height = parent.offsetHeight;
  }

  function rand(a, b) { return Math.random() * (b - a) + a; }

  function makeParticle() {
    return {
      x:     rand(0, W),
      y:     rand(0, H),
      vx:    rand(-CFG.speed, CFG.speed),
      vy:    rand(-CFG.speed * 0.8, -CFG.speed * 0.1),
      r:     rand(CFG.minR, CFG.maxR),
      color: CFG.colors[Math.floor(Math.random() * CFG.colors.length)],
      alpha: rand(0.35, 0.9),
      phase: rand(0, Math.PI * 2),
      freq:  rand(0.012, 0.028),
    };
  }

  function init() {
    particles = Array.from({ length: CFG.count }, makeParticle);
  }

  function drawConnections() {
    for (let i = 0; i < particles.length - 1; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist > CFG.connectDist) continue;

        const opacity = (1 - dist / CFG.connectDist) * CFG.connectAlpha;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = '#D532D7';
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function updateParticle(p) {
    p.phase += p.freq;
    p.x += p.vx;
    p.y += p.vy;

    /* Wrap-around lateral */
    if (p.x < -10) p.x = W + 10;
    if (p.x > W + 10) p.x = -10;
    /* Când iese sus, reapare jos cu X aleatoriu */
    if (p.y < -10) { p.x = rand(0, W); p.y = H + 10; }
    if (p.y > H + 10) { p.x = rand(0, W); p.y = -10; }
  }

  function drawParticle(p) {
    const opacity = p.alpha * (0.65 + 0.35 * Math.sin(p.phase));
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle   = p.color;
    ctx.shadowBlur  = 6;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { updateParticle(p); drawParticle(p); });
    rafId = requestAnimationFrame(loop);
  }

  /* Pauza când tab-ul nu e vizibil → economie CPU */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(rafId);
    else loop();
  });

  /* ResizeObserver — mai eficient decât window resize pentru canvas */
  const ro = new ResizeObserver(() => { resize(); });
  ro.observe(canvas.parentElement);

  resize();
  init();
  loop();
}());

/* ──────────────────────────────────────────────────────────
   2. NAVBAR — afișaj la scroll + hamburger mobil
   ────────────────────────────────────────────────────────── */
(function Navbar() {
  const navbar  = document.getElementById('navbar');
  const toggle  = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (!navbar || !toggle || !navLinks) return;

  /* Adaugă clasa 'scrolled' după 50px scroll */
  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Deschide / închide meniu mobil */
  toggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Închide meniu' : 'Deschide meniu');
  });

  /* Închide meniu la click pe link */
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Deschide meniu');
    });
  });

  /* Închide meniu la click în afara lui */
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* Închide meniu la apăsarea tastei Escape */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
}());

/* ──────────────────────────────────────────────────────────
   3. ANIMAȚII SCROLL — Intersection Observer
   ────────────────────────────────────────────────────────── */
(function ScrollAnimations() {
  if (!('IntersectionObserver' in window)) {
    /* Fallback pentru browsere vechi: arată totul direct */
    document.querySelectorAll('[data-animate]').forEach(el => el.classList.add('in-view'));
    return;
  }

  function createObserver(delay = 0) {
    return new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        /* Staggered delay opțional pe copii directe */
        const children = entry.target.querySelectorAll('.benefit-card, .game-card');
        if (children.length) {
          children.forEach((child, i) => {
            child.style.transitionDelay = `${i * 0.09}s`;
          });
        }
        setTimeout(() => entry.target.classList.add('in-view'), delay);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -36px 0px' });
  }

  const observer = createObserver(0);
  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
}());

/* ──────────────────────────────────────────────────────────
   4. COPIERE IP — clipboard cu fallback
   ────────────────────────────────────────────────────────── */
(function CopyIP() {
  const btn   = document.getElementById('copyBtn');
  const toast = document.getElementById('copyToast');
  const ipEl  = document.getElementById('serverIP');
  if (!btn || !toast || !ipEl) return;

  let timer;

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      /* Fallback textarea */
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  btn.addEventListener('click', async () => {
    const ip = ipEl.textContent.trim();
    try {
      await copyText(ip);
    } catch (err) {
      console.warn('Copy failed:', err);
    }

    /* Feedback vizual */
    btn.classList.add('copied');
    btn.querySelector('.copy-icon').textContent = '✅';
    btn.querySelector('.copy-text').textContent = 'Copiat!';
    toast.classList.add('visible');

    clearTimeout(timer);
    timer = setTimeout(() => {
      btn.classList.remove('copied');
      btn.querySelector('.copy-icon').textContent = '📋';
      btn.querySelector('.copy-text').textContent = 'Copiază IP';
      toast.classList.remove('visible');
    }, 2600);
  });
}());

/* ──────────────────────────────────────────────────────────
   5. SCROLL ÎNAPOI SUS
   ────────────────────────────────────────────────────────── */
(function ScrollTop() {
  const btn = document.getElementById('scrollToTopBtn');
  if (!btn) return;
  btn.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}());

/* ──────────────────────────────────────────────────────────
   6. AN CURENT ÎN FOOTER
   ────────────────────────────────────────────────────────── */
(function FooterYear() {
  const el = document.getElementById('currentYear');
  if (el) el.textContent = String(new Date().getFullYear());
}());

/* ──────────────────────────────────────────────────────────
   7. ÎNCĂRCARE STAFF DIN JSON — fetch + fallback hardcodat
   ────────────────────────────────────────────────────────── */
(function LoadStaff() {
  const container = document.getElementById('staffContainer');
  if (!container) return;

  /* Date hardcodate — fallback când fetch nu funcționează (ex: file://) */
  const STAFF_FALLBACK = {
    groups: [
      {
        id: 'fondatori', title: 'Fondatori', icon: '🥇',
        members: [
          {
            name: 'Bandana', role: 'Fondator', icon: '🥇',
            description: 'Vizionarul din spatele proiectului Crash SMP. Bandana a pornit totul de la zero, cu o idee simplă dar puternică: să creeze un server unde orice jucător se simte acasă și are un motiv să revină în fiecare zi.',
          },
          {
            name: 'Ianis68', role: 'Fondator', icon: '🥇',
            description: 'Cu ani de experiență în gaming și management de comunități online, Ianis68 este forța strategică din spatele Crash SMP. Atent la detalii și mereu cu ochii pe feedback-ul jucătorilor.',
          },
          {
            name: 'eusuntcris', role: 'Fondator', icon: '🥇',
            description: 'Sufletul creativ al echipei fondatoare. eusuntcris aduce energie proaspătă și idei inovatoare constant, asigurând că fiecare update și eveniment surprinde și încântă comunitatea.',
          },
        ],
      },
      {
        id: 'co-fondatori', title: 'Co-Fondatori', icon: '🥈',
        members: [
          {
            name: 'Johannis', role: 'Co-Fondator', icon: '🥈',
            description: 'Johannis este fața prietenoasă a staffului. Se ocupă de relațiile cu comunitatea și de menținerea unui mediu pozitiv pe server. Mereu disponibil pentru un sfat sau o sesiune de joc împreună.',
          },
          {
            name: 'Cretzu', role: 'Co-Fondator', icon: '🥈',
            description: 'Expert în moderare și echilibrul gameplay-ului, Cretzu asigură că regulile sunt respectate și că fiecare jucător are parte de o experiență corectă. Ferm, dar drept — exact ce vrei de la un staff.',
          },
          {
            name: 'JonhyXD', role: 'Co-Fondator', icon: '🥈',
            description: 'Cu umor și energie contagioasă, JonhyXD animă comunitatea și pune suflet în fiecare eveniment organizat. Dacă pe server e distracție, cu siguranță JonhyXD e undeva în spate cu un plan.',
          },
          {
            name: 'Aspect', role: 'Co-Fondator', icon: '🥈',
            description: 'Aspect este strategul din umbră al echipei — analizează feedback-ul jucătorilor cu atenție, propune îmbunătățiri concrete și se asigură că serverul evoluează constant în direcția potrivită.',
          },
        ],
      },
      {
        id: 'development', title: 'Development', icon: '💻',
        members: [
          {
            name: 'non name', role: 'High Developer & Web Developer', icon: '💻', featured: true,
            description: 'Omul care se asigură că sistemele și site-ul funcționează perfect! non name este arhitectul tehnic al Crash SMP — de la plugin-uri personalizate și optimizări de server, până la interfața web pe care o admiri chiar acum. Codul este arta lui.',
          },
        ],
      },
    ],
  };

  /* Încearcă fetch, folosește fallback la eroare */
  fetch('data/staff.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data  => renderStaff(data,            container))
    .catch(()   => renderStaff(STAFF_FALLBACK,  container));
}());

/* ─── Renderer staff ─── */
function renderStaff(data, container) {
  if (!data?.groups?.length) {
    container.innerHTML = '<p style="text-align:center;color:var(--c-text-muted);padding:40px 0">Echipa nu este disponibilă momentan.</p>';
    return;
  }

  container.innerHTML = '';

  data.groups.forEach((group, gi) => {
    const section = document.createElement('div');
    section.className = 'staff-group';
    section.setAttribute('data-animate', '');
    section.style.transitionDelay = `${gi * 0.12}s`;

    const count = group.members.length;
    section.innerHTML = `
      <div class="staff-group__header">
        <span class="staff-group__icon" aria-hidden="true">${group.icon}</span>
        <h3 class="staff-group__title">${escHtml(group.title)}</h3>
        <span class="staff-group__count">${count} ${count === 1 ? 'membru' : 'membri'}</span>
      </div>
      <div class="staff-grid">
        ${group.members.map((m, mi) => staffCardHTML(m, mi)).join('')}
      </div>
    `;

    container.appendChild(section);
  });

  /* Re-observă elementele nou create pentru animații scroll */
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });

    container.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));
  } else {
    container.querySelectorAll('[data-animate]').forEach(el => el.classList.add('in-view'));
  }
}

function staffCardHTML(member, idx) {
  const featured     = member.featured === true;
  const featuredClass = featured ? 'staff-card--featured' : '';
  const featuredBadge = featured
    ? '<span class="staff-card__featured-badge">⭐ Developer</span>'
    : '';
  const delay = idx * 0.07;

  return `
    <article
      class="staff-card ${featuredClass}"
      style="transition-delay:${delay}s"
      aria-label="Profil ${escHtml(member.name)}"
    >
      ${featuredBadge}
      <div class="staff-card__avatar" aria-hidden="true">${member.icon}</div>
      <h4 class="staff-card__name">${escHtml(member.name)}</h4>
      <p  class="staff-card__role">${escHtml(member.role)}</p>
      <p  class="staff-card__desc">${escHtml(member.description)}</p>
    </article>
  `;
}

/* Prevenire XSS la inserare HTML din JSON */
function escHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}
