/* main.js — Portfólio Adriano v3
 * Funcionalidades:
 * - AOS (respeita prefers-reduced-motion)
 * - Tema claro/escuro com persistência + atualização do theme-color
 * - Menu mobile acessível (Esc, clique fora, focus trap)
 * - Smooth scroll com offset do header + foco no destino
 * - Scrollspy (link ativo + aria-current)
 * - Botão “voltar ao topo”
 * - CountUp para [data-count-to]
 * - Filtro de projetos por tags (data-tags)
 * - Tilt suave nos .project (não em touch/reduced motion)
 */

/* trechos relevantes apenas — pode substituir seu main.js por este inteiro */

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ano atual
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // AOS (com marcação para liberar fallback)
  try {
    if (window.AOS) {
      AOS.init({ offset: 0, once: true, disable: prefersReduced });
      document.documentElement.classList.add('aos-enabled');
    }
  } catch(e){ /* noop */ }

  /* ... resto do seu main.js (tema, menu, smooth scroll, scrollspy, back-to-top, countup, filtro, tilt) ... */
})();


(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* =============================
     Utilidades
  ============================== */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = () => matchMedia('(hover: none), (pointer: coarse)').matches;
  const header = $('.site-header');

  /* =============================
     Ano atual
  ============================== */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* =============================
     AOS
  ============================== */
  if (window.AOS) {
    AOS.init({ offset: 0, once: true, disable: prefersReduced });
  }

  /* =============================
     Tema claro/escuro
  ============================== */
  const themeKey = 'theme';
  const root = document.documentElement;
  const themeBtn = $('#theme-toggle');
  const themeMeta = $('meta[name="theme-color"]');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem(themeKey);
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    themeBtn?.querySelector('i')?.classList.toggle('bx-moon', t !== 'dark');
    themeBtn?.querySelector('i')?.classList.toggle('bx-sun', t === 'dark');
    // Ajusta cor da barra do navegador
    if (themeMeta) themeMeta.setAttribute('content', t === 'dark' ? '#0b1116' : '#f6f8fb');
    localStorage.setItem(themeKey, t);
  }
  applyTheme(initialTheme);

  themeBtn?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  /* =============================
     Menu mobile acessível
  ============================== */
  const toggle = $('.menu-toggle');
  const menu = $('#menu');
  const nav = $('header .nav') || $('.nav');

  const focusableSelector = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
  let lastFocusedBeforeOpen = null;

  function openMenu() {
    if (!toggle || !menu) return;
    lastFocusedBeforeOpen = document.activeElement;
    toggle.setAttribute('aria-expanded', 'true');
    menu.classList.add('open');
    const focusables = $$(focusableSelector, menu);
    focusables[0]?.focus({ preventScroll: true });
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onDocClick);
  }

  function closeMenu() {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onDocClick);
    lastFocusedBeforeOpen?.focus?.({ preventScroll: true });
  }

  function onKeydown(e) {
    if (e.key === 'Escape') return closeMenu();
    if (e.key !== 'Tab') return;
    const focusables = $$(focusableSelector, menu).filter(el => !el.hasAttribute('disabled'));
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function onDocClick(e) {
    if (!menu.classList.contains('open')) return;
    if (!nav.contains(e.target) && e.target !== toggle) {
      closeMenu();
    }
  }

  toggle?.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    expanded ? closeMenu() : openMenu();
  });
  $$('#menu a').forEach(a => a.addEventListener('click', () => closeMenu()));

  /* =============================
     Smooth scroll com offset
  ============================== */
  const headerHeight = () => header?.offsetHeight ?? 64;

  function smoothScrollTo(target) {
    const y = target.getBoundingClientRect().top + window.pageYOffset - (headerHeight() + 8);
    if (prefersReduced) {
      window.scrollTo(0, y);
    } else {
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (id && id.length > 1) {
        const section = $(id);
        if (section) {
          e.preventDefault();
          smoothScrollTo(section);
          history.pushState(null, '', id);
        }
      }
    });
  });

  /* =============================
     Scrollspy
  ============================== */
  const sections = ['#inicio', '#sobre', '#projetos', '#servicos', '#experiencia', '#depoimentos', '#contato']
    .map(id => ({ id, el: $(id) }))
    .filter(s => s.el);

  const navLinks = new Map($$('#menu a').map(a => [a.getAttribute('href'), a]));

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const href = `#${entry.target.id}`;
        const link = navLinks.get(href);
        if (!link) return;
        if (entry.isIntersecting && entry.intersectionRatio > 0.55) {
          $$('#menu a').forEach(a => { a.classList.remove('active'); a.removeAttribute('aria-current'); });
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
      });
    }, { rootMargin: `-${headerHeight() + 16}px 0px -45% 0px`, threshold: [0.55, 0.75, 1] });

    sections.forEach(s => spy.observe(s.el));

    if (!$('#__activeStyle')) {
      const st = document.createElement('style');
      st.id = '__activeStyle';
      st.textContent = `.menu a.active{color:var(--text);background:rgba(140,199,214,.12)}`;
      document.head.appendChild(st);
    }
  }

  /* =============================
     Botão voltar ao topo
  ============================== */
  const backTop = document.createElement('button');
  backTop.className = 'back-to-top';
  backTop.setAttribute('aria-label', 'Voltar ao topo');
  backTop.innerHTML = '↑';
  document.body.appendChild(backTop);

  const styleBtn = document.createElement('style');
  styleBtn.textContent = `
    .back-to-top{position:fixed;right:16px;bottom:16px;width:42px;height:42px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,.06);color:var(--text);opacity:0;pointer-events:none;transition:opacity .2s ease, transform .12s ease;z-index:60}
    .back-to-top:hover{transform:translateY(-2px)}
    .back-to-top.show{opacity:1;pointer-events:auto}
  `;
  document.head.appendChild(styleBtn);

  function onScroll() {
    if (window.scrollY > 400) backTop.classList.add('show'); else backTop.classList.remove('show');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  backTop.addEventListener('click', () => {
    if (prefersReduced) window.scrollTo(0, 0); else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* =============================
     CountUp: <span data-count-to="1500" data-duration="1200"></span>
  ============================== */
  const counters = $$('[data-count-to]');
  if (counters.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);
        const to = parseFloat(el.getAttribute('data-count-to')) || 0;
        const dur = parseInt(el.getAttribute('data-duration'), 10) || 1000;
        const start = performance.now();
        const from = 0;
        const fmt = new Intl.NumberFormat('pt-BR');
        function tick(t) {
          const p = Math.min(1, (t - start) / dur);
          const val = Math.floor(from + (to - from) * p);
          el.textContent = fmt.format(val);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach(el => io.observe(el));
  }

  /* =============================
     Filtro de projetos (data-tags)
  ============================== */
  const chips = $$('.filters .chip');
  const cards = $$('.project');

  function setFilter(tag) {
    cards.forEach(card => {
      const tags = (card.getAttribute('data-tags') || '').toLowerCase();
      const show = tag === 'all' || tags.includes(tag);
      card.classList.toggle('hidden', !show);
    });
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      setFilter(chip.getAttribute('data-filter'));
    });
  });

  /* Inicializa com “Todos” */
  setFilter('all');

  /* =============================
     Tilt nos cards de projeto
  ============================== */
  if (!prefersReduced && !isTouch()) {
    $$('.project').forEach(card => {
      const strength = 8;
      card.style.willChange = 'transform';
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = (e.clientX - cx) / (r.width / 2);
        const dy = (e.clientY - cy) / (r.height / 2);
        const rx = (-dy * strength).toFixed(2);
        const ry = (dx * strength).toFixed(2);
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }
})();


