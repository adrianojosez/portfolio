// blog.js - lógica do blog (listar posts, busca, abrir post .md)

(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const isIndex = !!$('#list');
  const isPost  = !!$('#post-content');

  // Helpers
  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' }); }
    catch { return iso; }
  };
  const readingTime = (text) => {
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    const min = Math.max(1, Math.round(words / 200));
    return `${min} min de leitura`;
  };

  // Super simples parser de Markdown (títulos, negrito, itálico, links, listas, código)
  function mdToHtml(md) {
    // code blocks ```lang
    md = md.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang='', code='') => {
      const esc = code.replace(/[&<>]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]));
      return `<pre><code class="language-${lang}">${esc}</code></pre>`;
    });
    // inline code
    md = md.replace(/`([^`]+)`/g, (_, c) => `<code>${c.replace(/[&<>]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]))}</code>`);
    // headings
    md = md.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
    md = md.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
    md = md.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
    // bold / italic
    md = md.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    md = md.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // links [text](url)
    md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // blockquote
    md = md.replace(/^\>\s?(.*)$/gm, '<blockquote><p>$1</p></blockquote>');
    // unordered lists
    md = md.replace(/(?:^|\n)-(.*)(?=\n|$)/g, (m, item) => `\n<li>${item.trim()}</li>`);
    md = md.replace(/(?:<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
    // paragraphs (lines that are not wrapped yet)
    md = md.split(/\n{2,}/).map(block => {
      if (/^\s*<(h\d|ul|ol|pre|blockquote)/.test(block.trim())) return block;
      return `<p>${block.replace(/\n/g,' ').trim()}</p>`;
    }).join('\n');
    return md;
  }

  // Front matter: ---\nkey: value\n...\n---
  function parseFrontMatter(text) {
    const m = /^---\n([\s\S]+?)\n---\n?([\s\S]*)$/m.exec(text);
    if (!m) return [{}, text];
    const yaml = m[1], body = m[2];
    const data = {};
    yaml.split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx+1).trim();
      if (/^\[.*\]$/.test(val)) {
        try { val = JSON.parse(val.replace(/'/g, '"')); } catch { /* noop */ }
      } else {
        val = val.replace(/^"|"$/g,'').replace(/^'|'$/g,'');
      }
      data[key] = val;
    });
    return [data, body];
  }

  async function loadJSON(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Falha ao carregar: ' + url);
    return res.json();
  }
  async function loadText(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Falha ao carregar: ' + url);
    return res.text();
  }

  // INDEX PAGE
  if (isIndex) {
    const listEl = $('#list');
    const qEl    = $('#q');
    const tagsEl = $('#tags');
    let posts = [];

    function render(postsToRender) {
      listEl.innerHTML = postsToRender.map(p => {
        const tags = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join(' ');
        return `<article class="post-card" data-tags="${(p.tags||[]).join(' ').toLowerCase()}">
          <h2><a href="/blog/post.html?slug=${encodeURIComponent(p.slug)}">${p.title}</a></h2>
          <p class="meta">${fmtDate(p.date)} • ${p.readingTime || ''}</p>
          <p>${p.description || ''}</p>
          <div class="tags">${tags}</div>
        </article>`;
      }).join('');
    }

    function buildTagChips(all) {
      const unique = Array.from(new Set(all.flatMap(p => p.tags || []))).sort((a,b)=>a.localeCompare(b));
      tagsEl.innerHTML = ['<button class="chip active" data-filter="__all" aria-pressed="true">Todas</button>']
        .concat(unique.map(t => `<button class="chip" data-filter="${t}">${t}</button>`))
        .join('');
      $$('.chip', tagsEl).forEach(btn => {
        btn.addEventListener('click', () => {
          $$('.chip', tagsEl).forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
          btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
          applyFilters();
        });
      });
    }

    function applyFilters() {
      const term = (qEl.value || '').toLowerCase().trim();
      const active = $('.chip.active', tagsEl)?.getAttribute('data-filter') || '__all';
      const filtered = posts.filter(p => {
        const matchesTerm = !term || [p.title, p.description, (p.tags||[]).join(' ')].join(' ').toLowerCase().includes(term);
        const matchesTag  = active === '__all' || (p.tags||[]).map(s=>s.toLowerCase()).includes(active.toLowerCase());
        return matchesTerm && matchesTag;
      });
      render(filtered);
    }

    (async () => {
      try {
        posts = await loadJSON('/blog/posts/index.json');
        render(posts);
        buildTagChips(posts);
        qEl.addEventListener('input', applyFilters);
      } catch(e) {
        listEl.innerHTML = `<p class="subtitle">Não foi possível carregar os artigos.</p>`;
        console.error(e);
      }
    })();
  }

  // POST PAGE
  if (isPost) {
    (async () => {
      const params = new URLSearchParams(location.search);
      const slug = params.get('slug');
      const titleEl = $('#post-title');
      const dateEl  = $('#post-date');
      const tagsEl  = $('#post-tags');
      const contentEl = $('#post-content');
      const docTitle = $('#doc-title');
      const canonEl  = $('#canonical');

      if (!slug) {
        titleEl.textContent = 'Artigo não encontrado';
        contentEl.innerHTML = '<p>Slug ausente. <a href="/blog/">Voltar ao Blog</a></p>';
        return;
      }

      try {
        const raw = await (await fetch(`/blog/posts/${slug}.md`, { cache:'no-store' })).text();
        const [fm, body] = parseFrontMatter(raw);
        const html = mdToHtml(body);

        // preencher DOM
        const title = fm.title || 'Artigo';
        titleEl.textContent = title;
        docTitle.textContent = `${title} | Adriano José`;
        const iso = fm.date || new Date().toISOString().slice(0,10);
        dateEl.textContent = fmtDate(iso);
        dateEl.setAttribute('datetime', iso);
        const words = body.trim().split(/\s+/).filter(Boolean).length;
        $('#post-reading').textContent = readingTime(body);
        (fm.tags || []).forEach(t => {
          const li = document.createElement('li');
          li.textContent = t;
          tagsEl.appendChild(li);
        });
        contentEl.innerHTML = html;

        // Canonical e OG atualizados
        const url = `/blog/post.html?slug=${encodeURIComponent(slug)}`;
        canonEl.setAttribute('href', url);
        document.querySelector('meta[property="og:title"]').setAttribute('content', `${title} | Adriano José`);
        document.querySelector('meta[property="og:description"]').setAttribute('content', fm.description || 'Artigo do blog do Adriano José.');
        document.querySelector('meta[property="og:url"]').setAttribute('content', url);
        document.querySelector('meta[name="twitter:title"]').setAttribute('content', `${title} | Adriano José`);
        document.querySelector('meta[name="twitter:description"]').setAttribute('content', fm.description || 'Artigo do blog do Adriano José.');

        // JSON-LD BlogPosting
        const ld = {
          "@context":"https://schema.org",
          "@type":"BlogPosting",
          "headline": title,
          "datePublished": iso,
          "dateModified": iso,
          "author": { "@type":"Person", "name":"Adriano José" },
          "publisher": { "@type":"Person", "name":"Adriano José" },
          "mainEntityOfPage": { "@type":"WebPage", "@id": url },
          "inLanguage":"pt-BR",
          "description": fm.description || ""
        };
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(ld);
        document.head.appendChild(script);

      } catch (e) {
        console.error(e);
        $('#post-title').textContent = 'Artigo não encontrado';
        $('#post-content').innerHTML = '<p>Este post não foi localizado. <a href="/blog/">Voltar ao Blog</a></p>';
      }
    })();
  }
})();
