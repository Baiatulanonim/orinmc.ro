'use strict';

/* ── navbar scroll + hamburger ── */
(function Navbar() {
  const nav    = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (!nav || !toggle || !links) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !links.contains(e.target)) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}());

/* ── animații scroll ── */
(function ScrollAnim() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-animate]').forEach(el => el.classList.add('in-view'));
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in-view');
      obs.unobserve(e.target);
    });
  }, { threshold: 0.10, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));
}());

/* ── copiere IP (funcție comună) ── */
async function copyIP(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:-9999px;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

function showToast(toastEl, duration = 2200) {
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), duration);
}

/* buton hero */
(function HeroIP() {
  const btn   = document.getElementById('heroIpBtn');
  const toast = document.getElementById('heroToast');
  if (!btn || !toast) return;

  btn.addEventListener('click', async () => {
    try { await copyIP('crashsmp.ro'); } catch {}
    showToast(toast);
  });
}());

/* buton secțiunea conectare */
(function CopyBtn() {
  const btn   = document.getElementById('copyBtn');
  const toast = document.getElementById('copyToast');
  if (!btn || !toast) return;
  let t;

  btn.addEventListener('click', async () => {
    try { await copyIP('crashsmp.ro'); } catch {}

    btn.classList.add('copied');
    btn.querySelector('.ci').textContent = '✅';
    btn.querySelector('.ct').textContent = 'copiat!';
    showToast(toast);

    clearTimeout(t);
    t = setTimeout(() => {
      btn.classList.remove('copied');
      btn.querySelector('.ci').textContent = '📋';
      btn.querySelector('.ct').textContent = 'copiază';
    }, 2200);
  });
}());

/* ── an footer ── */
(function Year() {
  const el = document.getElementById('yr');
  if (el) el.textContent = new Date().getFullYear();
}());

/* ── staff din JSON ── */
(function Staff() {
  const container = document.getElementById('staffContainer');
  if (!container) return;

  const FALLBACK = {
    groups: [
      {
        id: 'fondatori', title: 'Fondatori', icon: '🥇',
        members: [
          { name: 'Bandana',     role: 'Fondator', icon: '🥇', description: 'A zis că face un server. Toată lumea a zis că e prea mult de muncă. L-a făcut oricum. Acum ești tu pe el.' },
          { name: 'Ianis68',     role: 'Fondator', icon: '🥇', description: 'Dacă e ceva stricat la 3 noaptea, Ianis68 știe deja. Nu înțelegem nici noi cum, dar știe.' },
          { name: 'eusuntcris',  role: 'Fondator', icon: '🥇', description: 'Responsabil de jumătate din ideile bune și toate evenimentele haotice de pe server. Staff-ul îl adoră și îl teme în egală măsură.' },
        ],
      },
      {
        id: 'co-fondatori', title: 'Co-Fondatori', icon: '🥈',
        members: [
          { name: 'Johannis', role: 'Co-Fondator', icon: '🥈', description: 'Cel mai accesibil din staff. Dacă ai o problemă și nu știi cui să-i scrii, scrie-i lui. O să răspundă.' },
          { name: 'Cretzu',   role: 'Co-Fondator', icon: '🥈', description: 'Nu tolerează cheat-eri. Nu tolerează drama. Cam atât tolerează. Dar e corect — și asta contează.' },
          { name: 'JonhyXD',  role: 'Co-Fondator', icon: '🥈', description: 'Dacă pe server s-a organizat ceva mișto, JonhyXD a avut de-a face cu asta. Garantat. Omul nu se plictisește niciodată.' },
          { name: 'Aspect',   role: 'Co-Fondator', icon: '🥈', description: 'Citește feedbackul jucătorilor și chiar face ceva cu el. Știm, e rar. Există și el.' },
        ],
      },
      {
        id: 'development', title: 'Development', icon: '💻',
        members: [
          { name: 'non name', role: 'High Developer & Web Developer', icon: '💻', featured: true, description: 'A scris site-ul ăsta. Și plugin-urile de pe server. Și mai repară ceva chiar acum, în timp ce citești asta.' },
        ],
      },
    ],
  };

  fetch('data/staff.json')
    .then(r => { if (!r.ok) throw 0; return r.json(); })
    .then(d => render(d))
    .catch(()  => render(FALLBACK));

  function render(data) {
    if (!data?.groups?.length) { container.textContent = 'Staff indisponibil momentan.'; return; }
    container.innerHTML = '';

    data.groups.forEach(group => {
      const sec = document.createElement('div');
      sec.className = 'staff-group';

      const n = group.members.length;
      sec.innerHTML = `
        <div class="staff-group__header">
          <span class="staff-group__icon">${group.icon}</span>
          <h3 class="staff-group__title">${esc(group.title)}</h3>
          <span class="staff-group__count">${n} ${n === 1 ? 'membru' : 'membri'}</span>
        </div>
        <div class="staff-grid">
          ${group.members.map(cardHTML).join('')}
        </div>`;

      container.appendChild(sec);
    });

    /* animații pe cardurile noi */
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); } });
      }, { threshold: 0.08 });
      container.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));
    }
  }

  function cardHTML(m) {
    const ft = m.featured === true;
    return `
      <article class="staff-card${ft ? ' staff-card--featured' : ''}" data-animate>
        ${ft ? '<span class="staff-card__featured-badge">⭐ dev</span>' : ''}
        <div class="staff-card__avatar" aria-hidden="true">${m.icon}</div>
        <h4 class="staff-card__name">${esc(m.name)}</h4>
        <p  class="staff-card__role">${esc(m.role)}</p>
        <p  class="staff-card__desc">${esc(m.description)}</p>
      </article>`;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
}());

/* ── 3D card tilt ── */
(function Tilt3D() {
  const INTENSITY = 12;
  const SCALE     = 1.03;

  function applyTilt(card) {
    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mousemove',  onMove);
    card.addEventListener('mouseleave', onLeave);
  }

  function onEnter(e) {
    e.currentTarget.style.transition =
      'transform 0.08s ease, box-shadow 0.08s ease, border-color 0.22s ease, background 0.22s ease';
  }

  function onLeave(e) {
    const c = e.currentTarget;
    c.style.transition =
      'transform 0.4s ease, box-shadow 0.4s ease, border-color 0.22s ease, background 0.22s ease';
    c.style.transform = '';
    c.style.boxShadow = '';
  }

  function onMove(e) {
    const c    = e.currentTarget;
    const rect = c.getBoundingClientRect();
    const x    = (e.clientX - rect.left)  / rect.width  - 0.5;
    const y    = (e.clientY - rect.top)   / rect.height - 0.5;
    const rx   = -y * INTENSITY;
    const ry   =  x * INTENSITY;
    c.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${SCALE})`;
    c.style.boxShadow = `${-ry * 1.2}px ${rx * 1.2}px 28px rgba(213,50,215,0.18)`;
  }

  document.querySelectorAll('.joc, .dece-list li, .connect-block').forEach(applyTilt);

  const staffContainer = document.getElementById('staffContainer');
  if (staffContainer) {
    new MutationObserver(() => {
      staffContainer.querySelectorAll('.staff-card:not([data-tilt])').forEach(c => {
        c.dataset.tilt = '1';
        applyTilt(c);
      });
    }).observe(staffContainer, { childList: true, subtree: true });
  }
}());
