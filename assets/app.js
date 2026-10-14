/* ニートシート — content/nav.json（フォルダ構成から自動生成）を読んでメニューを作り、Markdown を表示する小さなアプリ */
(() => {
  const CONTENT = 'content/';
  const COLORS = {
    'sql server': '#3B5BDB', excel: '#2B8A3E', winactor: '#D6336C', vba: '#7048E8',
    python: '#1971C2', 'power bi': '#E8890C', html: '#E8590C', css: '#0C8599', javascript: '#C99400'
  };
  const FALLBACK = ['#3B5BDB', '#2B8A3E', '#D6336C', '#7048E8', '#0C8599', '#E8890C'];
  const LANG_LABEL = {
    sql: 'SQL', python: 'Python', basic: 'VBA', vb: 'VBA', vba: 'VBA', 'visual-basic': 'VBA',
    javascript: 'JavaScript', js: 'JavaScript', html: 'HTML', css: 'CSS', bash: 'Shell',
    powershell: 'PowerShell', json: 'JSON', 'excel-formula': 'Excel', excel: 'Excel', dax: 'DAX'
  };
  const LANG_ALIAS = { vba: 'visual-basic', vb: 'visual-basic', excel: 'excel-formula', html: 'markup', js: 'javascript' };

  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  let site = { title: 'ニートシート', cats: [], pages: [] };
  const cache = new Map();

  /* ---------- nav.json を読む ---------- */
  const SITE_TITLE = document.querySelector('meta[name="site-title"]')?.content || 'ニートシート';
  const nfc = t => (t || '').normalize('NFC');
  function buildSite(nav) {
    const s = { title: SITE_TITLE, cats: [], pages: [] };
    nav.cats.forEach((c, ci) => {
      const cat = { name: c.name, slug: c.name, groups: [], pages: [] };
      cat.color = COLORS[c.name.toLowerCase()] || FALLBACK[ci % FALLBACK.length];
      c.groups.forEach(g => {
        const group = { name: g.name, pages: [] };
        g.pages.forEach(p => {
          const page = {
            title: p.title, file: p.file, kw: p.kw || '', body: p.body, updated: p.updated || '', cat, group,
            route: [c.name, g.name, p.title].filter(Boolean).join('/')
          };
          group.pages.push(page); cat.pages.push(page); s.pages.push(page);
        });
        cat.groups.push(group);
      });
      s.cats.push(cat);
    });
    return s;
  }
  const urlOf = file => CONTENT + file.split('/').map(encodeURIComponent).join('/');
  const hrefOf = route => '#/' + route.split('/').map(encodeURIComponent).join('/');

  async function load(file) {
    if (cache.has(file)) return cache.get(file);
    const res = await fetch(urlOf(file), { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    const t = await res.text();
    cache.set(file, t);
    return t;
  }

  /* ---------- sidebar ---------- */
  const chev = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  function renderSidebar() {
    const open = JSON.parse(store.get('openCats') || 'null');
    const closedGroups = JSON.parse(store.get('closedGroups') || '[]');
    $('#sidebar').innerHTML = site.cats.map(c => `
      <div class="nav-cat" data-slug="${esc(c.slug)}" style="--c:${c.color}" data-open="${open ? open.includes(c.slug) : c.pages.length > 0 && c === site.cats[0]}">
        <button type="button" class="nav-cat-btn" aria-expanded="false"><span class="dot"></span>${esc(c.name)}
          <span class="count">${c.pages.length || ''}</span>${chev}</button>
        <div class="nav-body">
          ${c.pages.length ? c.groups.map(g => {
            const links = g.pages.map(p => `<a href="${hrefOf(p.route)}" data-route="${esc(p.route)}">${esc(p.title)}</a>`).join('');
            if (!g.name) return `<div class="nav-links">${links}</div>`;
            const key = c.slug + '/' + g.name;
            return `<div class="nav-grp" data-key="${esc(key)}" data-open="${!closedGroups.includes(key)}">
              <button type="button" class="nav-grp-btn" aria-expanded="${!closedGroups.includes(key)}">${chev}<span>${esc(g.name)}</span><span class="count">${g.pages.length}</span></button>
              <div class="nav-links">${links}</div></div>`;
          }).join('') : '<div class="nav-empty">まだページはありません</div>'}
        </div>
      </div>`).join('');
    const saveCats = () => store.set('openCats', JSON.stringify([...document.querySelectorAll('.nav-cat[data-open="true"]')].map(e => e.dataset.slug)));
    const saveGroups = () => store.set('closedGroups', JSON.stringify([...document.querySelectorAll('.nav-grp[data-open="false"]')].map(e => e.dataset.key)));
    $('#sidebar').querySelectorAll('.nav-cat-btn').forEach(b => {
      const cat = b.parentElement;
      b.setAttribute('aria-expanded', cat.dataset.open);
      b.addEventListener('click', () => {
        cat.dataset.open = cat.dataset.open !== 'true';
        b.setAttribute('aria-expanded', cat.dataset.open);
        saveCats();
      });
    });
    $('#sidebar').querySelectorAll('.nav-grp-btn').forEach(b => {
      const grp = b.parentElement;
      b.addEventListener('click', () => {
        grp.dataset.open = grp.dataset.open !== 'true';
        b.setAttribute('aria-expanded', grp.dataset.open);
        saveGroups();
      });
    });
  }
  function renderTopnav() {
    $('#topnav').innerHTML = site.cats.map(c => c.pages.length
      ? `<a href="${hrefOf(c.slug)}" data-cat="${esc(c.slug)}" style="--c:${c.color}"><span class="dot"></span>${esc(c.name)}</a>`
      : `<a href="${hrefOf(c.slug)}" data-cat="${esc(c.slug)}" style="--c:${c.color}" class="soon-link" title="準備中"><span class="dot"></span>${esc(c.name)}</a>`).join('');
  }
  function markTopnav(route) {
    const cat = route.split('/')[0];
    document.querySelectorAll('#topnav a').forEach(a => {
      const on = !!route && nfc(a.dataset.cat) === cat;
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  function markCurrent(route) {
    markTopnav(route);
    document.querySelectorAll('.nav-links a').forEach(a => {
      const on = nfc(a.dataset.route) === route;
      a.toggleAttribute('aria-current', on);
      if (on) {
        a.setAttribute('aria-current', 'page');
        const c = a.closest('.nav-cat'); c.dataset.open = 'true'; c.firstElementChild.setAttribute('aria-expanded', 'true');
        const g = a.closest('.nav-grp'); if (g) { g.dataset.open = 'true'; g.firstElementChild.setAttribute('aria-expanded', 'true'); }
      }
    });
  }

  /* ---------- 最近見たページ ---------- */
  const RECENT_MAX = 6;
  const getRecent = () => { try { return JSON.parse(store.get('recent') || '[]'); } catch (e) { return []; } };
  function pushRecent(route) {
    const list = [route, ...getRecent().filter(r => r !== route)].slice(0, RECENT_MAX);
    store.set('recent', JSON.stringify(list));
  }
  const fmtDate = d => d ? d.replace(/-/g, '/') : '';

  /* ---------- views ---------- */
  const main = () => $('#main');
  const searchHint = '関数名・やりたいことで探す（例：LAG、年齢、NULL）';
  const searchIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>';

  function indexList(pages) {
    return `<ul class="index-list">${pages.map(p => `
      <li><a href="${hrefOf(p.route)}"><span class="kw">${esc(p.kw || p.title)}</span><span class="leader"></span><span class="ttl">${esc(p.title)}</span></a></li>`).join('')}</ul>`;
  }
  function catIndex(c, linkHead) {
    return `<section class="index-cat">
      <h2><span class="dot" style="--c:${c.color}"></span>${linkHead ? `<a href="${hrefOf(c.slug)}">${esc(c.name)}</a>` : esc(c.name)}<small>${c.pages.length}</small></h2>
      ${c.groups.filter(g => g.pages.length).map(g => `${g.name ? `<div class="index-group">${esc(g.name)}</div>` : ''}${indexList(g.pages)}`).join('')}
    </section>`;
  }

  function tile(c) {
    return c.pages.length
      ? `<a class="tile" href="${hrefOf(c.slug)}" style="--c:${c.color}">
           <span class="tile-name">${esc(c.name)}</span>
           <span class="tile-count"><b>${c.pages.length}</b> ページ</span></a>`
      : `<a class="tile empty" href="${hrefOf(c.slug)}" style="--c:${c.color}">
           <span class="tile-name"><span class="dot"></span>${esc(c.name)}</span><span class="tile-count">準備中</span></a>`;
  }

  function renderHome() {
    document.body.classList.add('is-home');
    document.documentElement.style.setProperty('--cat', 'var(--brand)');
    main().innerHTML = `
      <header class="page-head">
        <h1 class="page-title">${esc(site.title)}</h1>
        <p class="page-lead">よく使う書き方を、すぐ引ける早見表。全 ${site.pages.length} ページ。</p>
        <button class="home-search" type="button" data-open-search>${searchIcon}<span>${searchHint}</span><kbd>Ctrl K</kbd></button>
      </header>
      <div class="page-body">
        <h2 class="section-title">カテゴリ</h2>
        <section class="tiles" aria-label="カテゴリ">${site.cats.map(tile).join('')}</section>
        ${(() => {
          const recent = getRecent().map(r => site.pages.find(p => nfc(p.route) === nfc(r))).filter(Boolean).slice(0, 4);
          return recent.length ? `<h2 class="section-title">最近見たページ</h2>
            <ul class="recent">${recent.map(p => `<li><a href="${hrefOf(p.route)}" style="--c:${p.cat.color}">
              <span class="rc-cat"><span class="dot"></span>${esc(p.cat.name)}</span>
              <span class="rc-title">${esc(p.title)}</span>
              ${p.kw ? `<span class="rc-kw">${esc(p.kw)}</span>` : ''}</a></li>`).join('')}</ul>` : '';
        })()}
      </div>`;
    ($('#toc') || {}).innerHTML = '';
    document.title = site.title;
  }

  function renderCategory(c) {
    document.body.classList.remove('is-home');
    document.documentElement.style.setProperty('--cat', c.color);
    main().innerHTML = `
      <header class="page-head">
        <div class="crumbs"><a href="#/">ホーム</a><span class="sep">›</span><span>${esc(c.name)}</span></div>
        <h1 class="page-title"><span class="title-dot"></span>${esc(c.name)}</h1>
        <p class="page-lead">${c.pages.length ? `${c.groups.filter(g => g.pages.length).length} グループ・${c.pages.length} ページ` : 'まだページはありません'}</p>
      </header>
      <div class="page-body">
        ${c.pages.length ? c.groups.filter(g => g.pages.length).map(g => `
          <section class="cat-group">
            ${g.name ? `<h2 class="cat-group-title">${esc(g.name)}<small>${g.pages.length}</small></h2>` : ''}
            <ul class="page-list">${g.pages.map(p => `
              <li><a href="${hrefOf(p.route)}">
                <span class="pl-title">${esc(p.title)}</span>
                ${p.kw ? `<span class="pl-kw">${p.kw.split(/[/／、,]/).map(k => `<code>${esc(k.trim())}</code>`).join('')}</span>` : ''}
                <svg class="pl-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
              </a></li>`).join('')}
            </ul>
          </section>`).join('')
        : `<div class="empty-state">
            <p>このカテゴリにはまだページがありません。</p>
            <p><code>content</code> の「${esc(c.name)}」フォルダの中にグループのフォルダを作り、Markdown ファイルを置くと、ここに並びます。書き方は <code>content/_サンプル.md</code> を参考にしてください。</p>
          </div>`}
      </div>`;
    ($('#toc') || {}).innerHTML = '';
    document.title = `${c.name} | ${site.title}`;
  }

  const safeDecode = t => { try { return decodeURIComponent(t); } catch (e) { return t; } };
  function resolve(base, href) {
    const parts = (base + href).split('/'), out = [];
    for (const p of parts) { if (p === '..') out.pop(); else if (p !== '.') out.push(p); }
    return out.join('/');
  }

  function enhance(root, page) {
    const dir = page.body != null ? '' : page.file.replace(/[^/]+$/, '');
    root.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src && !/^(https?:|data:|\/)/.test(src)) img.src = urlOf(resolve(dir, safeDecode(src)));
      img.loading = 'lazy';
    });
    root.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
      else if (/\.md(#.*)?$/i.test(href)) {
        const file = nfc(resolve(dir, safeDecode(href.replace(/#.*$/, ''))));
        const target = site.pages.find(p => nfc(p.file) === file);
        if (target) a.setAttribute('href', hrefOf(target.route));
        else { a.removeAttribute('href'); a.title = 'リンク先のページが見つかりません'; }
      }
    });
    root.querySelectorAll('table').forEach(t => {
      const w = document.createElement('div'); w.className = 'table-wrap'; t.replaceWith(w); w.appendChild(t);
    });
    root.querySelectorAll('pre > code').forEach(code => {
      let lang = ((code.className.match(/language-([\w-]+)/) || [])[1] || '').toLowerCase();
      const label = LANG_LABEL[lang] || (lang ? lang : 'テキスト');
      const pl = LANG_ALIAS[lang] || lang;
      if (pl && window.Prism && Prism.languages[pl]) { code.className = 'language-' + pl; Prism.highlightElement(code); }
      // 「-- → 結果」のような実行結果コメントを見分けやすくする
      code.querySelectorAll('.token.comment').forEach(t => { if (/→/.test(t.textContent)) t.classList.add('result'); });
      const pre = code.parentElement, box = document.createElement('div');
      box.className = 'code';
      box.innerHTML = `<div class="code-head"><span class="code-lang">${esc(label)}</span><button class="copy" type="button">コピー</button></div>`;
      pre.replaceWith(box); box.appendChild(pre);
      box.querySelector('.copy').addEventListener('click', async e => {
        const btn = e.currentTarget;
        try { await navigator.clipboard.writeText(code.innerText); btn.textContent = 'コピーしました'; btn.classList.add('done'); }
        catch (err) { btn.textContent = 'コピーできませんでした'; }
        setTimeout(() => { btn.textContent = 'コピー'; btn.classList.remove('done'); }, 1600);
      });
    });
    // 見出しに id を付けて目次を作る
    const heads = [...root.querySelectorAll('h2, h3')];
    heads.forEach((h, i) => { h.id = 'h-' + i; });
    $('#toc').innerHTML = heads.length > 1 ? '<p>このページの見出し</p>' + heads.map(h =>
      `<a href="#${h.id}" data-target="${h.id}" class="${h.tagName === 'H3' ? 'lv3' : 'lv2'}">${esc(h.textContent)}</a>`).join('') : '';
    $('#toc').querySelectorAll('a').forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); document.getElementById(a.dataset.target).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }));
    spy(heads);
  }

  let observer;
  function spy(heads) {
    observer?.disconnect();
    if (!heads.length) return;
    observer = new IntersectionObserver(entries => {
      const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!vis) return;
      $('#toc').querySelectorAll('a').forEach(a => a.classList.toggle('active', a.dataset.target === vis.target.id));
    }, { rootMargin: '-70px 0px -70% 0px' });
    heads.forEach(h => observer.observe(h));
  }

  // 先頭の「# タイトル」と「キーワード: …」行は画面上部に別で出すので本文から外す
  const stripHead = md => md.replace(/<!--[\s\S]*?-->/g, '').replace(/^\uFEFF?\s*#\s+.*\n?/, '').replace(/^\s*(キーワード|keywords?)\s*[:：].*\n?/i, '');

  async function renderPage(page) {
    let md;
    try { md = page.body != null ? page.body : await load(page.file); }
    catch (e) {
      document.documentElement.style.setProperty('--cat', 'var(--brand)');
      main().innerHTML = `<header class="page-head"><h1 class="page-title">ページを読み込めませんでした</h1></header><div class="page-body"><p class="notice"><code>content/${esc(page.file)}</code> が見つかりません。ファイルを移動・改名した直後なら、数分待ってから再読み込みしてください。</p></div>`;
      return;
    }
    document.body.classList.remove('is-home');
    document.documentElement.style.setProperty('--cat', page.cat.color);
    const i = site.pages.indexOf(page), prev = site.pages[i - 1], next = site.pages[i + 1];
    main().innerHTML = `
      <header class="page-head">
        <div class="crumbs"><a href="#/">ホーム</a><span class="sep">›</span><a href="${hrefOf(page.cat.slug)}">${esc(page.cat.name)}</a>
          ${page.group.name ? `<span class="sep">›</span><span>${esc(page.group.name)}</span>` : ''}</div>
        <h1 class="page-title">${esc(page.title)}</h1>
        <div class="head-meta">${page.kw ? `<div class="chips">${page.kw.split(/[/／、,]/).map(k => `<span class="chip">${esc(k.trim())}</span>`).join('')}</div>` : ''}
        ${page.updated ? `<span class="updated">最終更新 ${fmtDate(page.updated)}</span>` : ''}</div>
      </header>
      <div class="page-body has-toc">
        <div class="page-main">
          <article class="md">${marked.parse(stripHead(md), { gfm: true, breaks: true })}</article>
          <nav class="pager" aria-label="前後のページ">
            ${prev ? `<a class="prev" href="${hrefOf(prev.route)}"><small>前のページ</small>${esc(prev.title)}</a>` : ''}
            ${next ? `<a class="next" href="${hrefOf(next.route)}"><small>次のページ</small>${esc(next.title)}</a>` : ''}
          </nav>
        </div>
        <aside class="toc" id="toc" aria-label="このページの見出し"></aside>
      </div>`;
    enhance($('.md', main()), page);
    pushRecent(page.route);
    document.title = `${page.title} | ${site.title}`;
  }

  function renderNotFound() {
    document.body.classList.remove('is-home');
    document.documentElement.style.setProperty('--cat', 'var(--brand)');
    main().innerHTML = `<header class="page-head"><h1 class="page-title">ページが見つかりません</h1></header><div class="page-body"><p class="notice">リンクが古いか、ページの場所が変わった可能性があります。<a href="#/">ホームに戻る</a>か、検索で探してください。</p></div>`;
    ($('#toc') || {}).innerHTML = '';
  }

  async function route() {
    const path = nfc(safeDecode(location.hash.replace(/^#\/?/, ''))).replace(/\/$/, '');
    document.body.classList.remove('nav-open'); $('#scrim').hidden = true; $('#menuBtn').setAttribute('aria-expanded', 'false');
    markCurrent(path);
    if (!path) renderHome();
    else {
      const page = site.pages.find(p => nfc(p.route) === path);
      const cat = site.cats.find(c => nfc(c.slug) === path);
      if (page) await renderPage(page);
      else if (cat) renderCategory(cat);
      else renderNotFound();
    }
    window.scrollTo(0, 0);
  }

  /* ---------- search ---------- */
  let index = null;
  const plain = md => md
    .replace(/```[\w-]*\n?/g, ' ').replace(/<[^>]+>/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#>*`|_-]{1,}/g, ' ').replace(/\s+/g, ' ').trim();

  async function buildIndex() {
    if (index) return index;
    index = await Promise.all(site.pages.map(async p => {
      let md = '';
      try { md = stripHead(p.body != null ? p.body : await load(p.file)); } catch (e) {}
      const heads = (md.match(/^#{2,4}\s+.+$/gm) || []).map(h => h.replace(/^#+\s+/, '').replace(/\*\*/g, '')).join(' ');
      return { p, title: p.title.toLowerCase(), kw: p.kw.toLowerCase(), heads: heads.toLowerCase(), body: plain(md), bodyL: plain(md).toLowerCase() };
    }));
    return index;
  }

  function highlight(text, terms) {
    let out = esc(text);
    terms.forEach(t => { if (t) out = out.replace(new RegExp(esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`); });
    return out;
  }

  let sel = 0, hits = [];
  async function runSearch(q) {
    const list = $('#results');
    const terms = q.toLowerCase().split(/[\s　]+/).filter(Boolean);
    const idx = await buildIndex();
    if (!terms.length) {
      hits = site.pages.slice(0, 8).map(p => ({ p, snip: '' }));
    } else {
      hits = idx.map(d => {
        let score = 0;
        for (const t of terms) {
          const s = (d.title.includes(t) ? 10 : 0) + (d.kw.includes(t) ? 8 : 0) + (d.heads.includes(t) ? 4 : 0) + (d.bodyL.includes(t) ? 1 : 0);
          if (!s) return null;
          score += s;
        }
        const pos = d.bodyL.indexOf(terms[0]);
        const snip = pos < 0 ? d.body.slice(0, 90) : (pos > 30 ? '…' : '') + d.body.slice(Math.max(0, pos - 30), pos + 70);
        return { p: d.p, score, snip };
      }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 20);
    }
    sel = 0;
    list.innerHTML = hits.length ? hits.map((h, i) => `
      <li role="option" aria-selected="${i === 0}"><a href="${hrefOf(h.p.route)}">
        <div class="r-title"><span class="r-name">${highlight(h.p.title, terms)}</span>${h.p.kw ? `<span class="r-kw">${highlight(h.p.kw, terms)}</span>` : ''}<span class="r-cat">${esc(h.p.cat.name)}</span></div>
        ${h.snip ? `<div class="r-snip">${highlight(h.snip, terms)}</div>` : ''}
      </a></li>`).join('')
      : `<li class="r-empty">「${esc(q)}」に一致するページはありません。言葉を短くするか、関数名で探してみてください。</li>`;
    list.querySelectorAll('a').forEach(a => a.addEventListener('click', () => $('#searchDialog').close()));
  }
  function moveSel(d) {
    const items = [...$('#results').querySelectorAll('li[role="option"]')];
    if (!items.length) return;
    sel = (sel + d + items.length) % items.length;
    items.forEach((li, i) => li.setAttribute('aria-selected', i === sel));
    items[sel].scrollIntoView({ block: 'nearest' });
  }
  function openSearch() {
    const dlg = $('#searchDialog');
    if (dlg.open) return;
    dlg.showModal();
    const input = $('#searchInput'); input.value = ''; input.focus();
    runSearch('');
  }

  /* ---------- wiring ---------- */
  function wire() {
    $('#searchBtn').addEventListener('click', openSearch);
    document.addEventListener('click', e => { if (e.target.closest('[data-open-search]')) openSearch(); });
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
      else if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
    });
    const input = $('#searchInput');
    input.addEventListener('input', () => runSearch(input.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
      else if (e.key === 'Escape') { e.preventDefault(); $('#searchDialog').close(); }
      else if (e.key === 'Enter' && hits[sel]) { e.preventDefault(); location.hash = hrefOf(hits[sel].p.route); $('#searchDialog').close(); }
    });
    $('#searchDialog').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });

    $('#themeBtn').addEventListener('click', () => {
      const root = document.documentElement;
      const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
      store.set('theme', root.dataset.theme);
    });
    const toggleNav = open => {
      document.body.classList.toggle('nav-open', open); $('#scrim').hidden = !open;
      $('#menuBtn').setAttribute('aria-expanded', open);
    };
    $('#menuBtn').addEventListener('click', () => toggleNav(!document.body.classList.contains('nav-open')));
    $('#scrim').addEventListener('click', () => toggleNav(false));
    window.addEventListener('hashchange', route);
  }

  function setupToTop() {
    const btn = document.createElement('button');
    btn.className = 'to-top'; btn.type = 'button'; btn.setAttribute('aria-label', 'ページの先頭に戻る'); btn.hidden = true;
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg><span>上へ</span>';
    document.body.appendChild(btn);
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
    const onScroll = () => { btn.hidden = window.scrollY < 600; };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  async function start() {
    wire();
    setupToTop();
    try { site = buildSite(JSON.parse(await load('nav.json'))); }
    catch (e) { main().innerHTML = '<h1 class="page-title">メニューを読み込めませんでした</h1><p class="notice"><code>content/nav.json</code> がありません。GitHub の「Actions」タブで公開処理が成功しているか確認してください。</p>'; return; }
    $('#brand').textContent = site.title;
    renderSidebar();
    renderTopnav();
    route();
  }
  start();
})();
