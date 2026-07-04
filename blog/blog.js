/* ══ SCRIBE'S ARCHIVE — blog engine (vanilla JS, no dependencies) ══ */
(function () {
  'use strict';

  var SITE = 'https://hamnajalil.com';

  /* ── theme: shared with the main portfolio via localStorage ── */
  function initTheme() {
    var btn = document.getElementById('themeBtn');
    var saved = localStorage.getItem('portfolioTheme') || 'dark';
    if (saved === 'light') document.body.classList.add('light-mode');
    if (!btn) return;
    btn.textContent = saved === 'light' ? '☀ LIGHT' : '◑ DARK';
    btn.addEventListener('click', function () {
      var isLight = document.body.classList.toggle('light-mode');
      btn.textContent = isLight ? '☀ LIGHT' : '◑ DARK';
      localStorage.setItem('portfolioTheme', isLight ? 'light' : 'dark');
    });
  }

  /* ── front matter: --- key: value --- block at top of a .md file ── */
  function parseFrontMatter(text) {
    var meta = {}, body = text;
    var m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (m) {
      body = text.slice(m[0].length);
      m[1].split(/\r?\n/).forEach(function (line) {
        var i = line.indexOf(':');
        if (i < 0) return;
        var k = line.slice(0, i).trim();
        var v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
        if (k === 'tags') {
          v = v.replace(/^\[|\]$/g, '');
          meta.tags = v ? v.split(',').map(function (t) { return t.trim().replace(/^["']|["']$/g, ''); }) : [];
        } else meta[k] = v;
      });
    }
    return { meta: meta, body: body };
  }

  /* ── minimal markdown → HTML ── */
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function inline(s) {
    return s
      .replace(/`([^`]+)`/g, function (_, c) { return '<code>' + c + '</code>'; })
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, u) {
        var ext = /^https?:\/\//.test(u) && u.indexOf(SITE) !== 0;
        return '<a href="' + u + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + t + '</a>';
      })
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  }
  function mdToHtml(md) {
    var lines = md.replace(/\r\n/g, '\n').split('\n');
    var out = [], i = 0, n = lines.length;

    function listBlock(ordered) {
      var re = ordered ? /^\s*\d+\.\s+(.*)/ : /^\s*[-*]\s+(.*)/;
      var items = [];
      while (i < n) {
        var m = lines[i].match(re);
        if (!m) break;
        items.push('<li>' + inline(esc(m[1])) + '</li>');
        i++;
      }
      out.push((ordered ? '<ol>' : '<ul>') + items.join('') + (ordered ? '</ol>' : '</ul>'));
    }

    while (i < n) {
      var line = lines[i];

      if (/^\s*$/.test(line)) { i++; continue; }

      // fenced code
      var fence = line.match(/^```(\w*)/);
      if (fence) {
        var code = []; i++;
        while (i < n && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
        i++; // closing fence
        out.push('<pre><code' + (fence[1] ? ' class="lang-' + fence[1] + '"' : '') + '>' + esc(code.join('\n')) + '</code></pre>');
        continue;
      }
      // heading
      var h = line.match(/^(#{1,6})\s+(.*)/);
      if (h) { var lvl = h[1].length; out.push('<h' + lvl + '>' + inline(esc(h[2])) + '</h' + lvl + '>'); i++; continue; }
      // hr
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
      // blockquote
      if (/^\s*>\s?/.test(line)) {
        var q = [];
        while (i < n && /^\s*>\s?/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        out.push('<blockquote>' + inline(esc(q.join(' '))) + '</blockquote>');
        continue;
      }
      // lists
      if (/^\s*[-*]\s+/.test(line)) { listBlock(false); continue; }
      if (/^\s*\d+\.\s+/.test(line)) { listBlock(true); continue; }
      // table
      if (/\|/.test(line) && i + 1 < n && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
        var cells = function (l) {
          return l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(function (c) { return inline(esc(c.trim())); });
        };
        var head = cells(line); i += 2;
        var rows = [];
        while (i < n && /\|/.test(lines[i]) && !/^\s*$/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
        out.push('<table><thead><tr>' + head.map(function (c) { return '<th>' + c + '</th>'; }).join('') +
          '</tr></thead><tbody>' + rows.map(function (r) {
            return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
          }).join('') + '</tbody></table>');
        continue;
      }
      // paragraph (merge soft-wrapped lines)
      var p = [line];
      i++;
      while (i < n && !/^\s*$/.test(lines[i]) && !/^(#{1,6}\s|```|\s*[-*]\s|\s*\d+\.\s|\s*>|-{3,}\s*$)/.test(lines[i])) {
        p.push(lines[i]); i++;
      }
      out.push('<p>' + inline(esc(p.join(' '))) + '</p>');
    }
    return out.join('\n');
  }

  function fmtDate(iso) {
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  function readingTime(text) {
    var words = text.split(/\s+/).length;
    return Math.max(1, Math.round(words / 220)) + ' min read';
  }
  function setMeta(attr, key, content) {
    var el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute('content', content);
  }

  /* ── index page ── */
  function renderIndex() {
    var list = document.getElementById('postList');
    if (!list) return;
    fetch('posts.json').then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (posts) {
      posts.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      if (!posts.length) {
        list.innerHTML = '<li class="blog-empty">The archive is empty — the first scroll is being penned. ✦</li>';
        return;
      }
      list.innerHTML = posts.map(function (p) {
        return '<li class="post-card"><a href="post.html?p=' + encodeURIComponent(p.slug) + '">' +
          '<div class="post-card-meta"><span>' + fmtDate(p.date) + '</span>' +
          (p.tags && p.tags.length ? '<span class="sep">·</span><span class="post-tags">' +
            p.tags.map(function (t) { return '<span class="post-tag">' + esc(t) + '</span>'; }).join('') + '</span>' : '') +
          '</div><h2>' + esc(p.title) + '</h2><p>' + esc(p.description || '') + '</p>' +
          '<span class="read-more">READ THE SCROLL →</span></a></li>';
      }).join('');
    }).catch(function (e) {
      list.innerHTML = '<li class="blog-error">Could not load the archive (' + esc(String(e.message || e)) + '). Try refreshing.</li>';
    });
  }

  /* ── post page ── */
  function renderPost() {
    var el = document.getElementById('postBody');
    if (!el) return;
    var slug = new URLSearchParams(location.search).get('p') || '';
    if (!/^[a-z0-9-]+$/i.test(slug)) {
      el.innerHTML = '<p class="blog-error">Scroll not found. <a href="./">Return to the archive.</a></p>';
      return;
    }
    fetch('posts/' + slug + '.md').then(function (r) {
      if (!r.ok) throw new Error('post not found');
      return r.text();
    }).then(function (text) {
      var parsed = parseFrontMatter(text);
      var meta = parsed.meta;
      var title = meta.title || slug;

      document.getElementById('postTitle').textContent = title;
      document.getElementById('postMeta').innerHTML =
        '<span>' + (meta.date ? fmtDate(meta.date) : '') + '</span><span class="sep">·</span><span>' +
        readingTime(parsed.body) + '</span>';
      var tagsEl = document.getElementById('postTags');
      if (meta.tags && meta.tags.length) {
        tagsEl.innerHTML = meta.tags.map(function (t) { return '<span class="post-tag">' + esc(t) + '</span>'; }).join('');
      }
      el.innerHTML = mdToHtml(parsed.body);

      /* SEO meta (client-side; feed + static tags cover crawlers that skip JS) */
      var url = SITE + '/blog/post.html?p=' + encodeURIComponent(slug);
      document.title = title + ' · Hamna Jalil';
      if (meta.description) { setMeta('name', 'description', meta.description); setMeta('property', 'og:description', meta.description); }
      setMeta('property', 'og:title', title);
      setMeta('property', 'og:type', 'article');
      setMeta('property', 'og:url', url);
      if (meta.image) setMeta('property', 'og:image', /^https?:/.test(meta.image) ? meta.image : SITE + meta.image);
      setMeta('name', 'twitter:card', 'summary_large_image');
      var canon = document.querySelector('link[rel="canonical"]') || document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'canonical' }));
      canon.href = url;

      var ld = {
        '@context': 'https://schema.org', '@type': 'BlogPosting',
        headline: title, datePublished: meta.date, url: url,
        author: { '@type': 'Person', name: 'Hamna Jalil', url: SITE },
        description: meta.description || ''
      };
      var s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(ld);
      document.head.appendChild(s);
    }).catch(function () {
      el.innerHTML = '<p class="blog-error">This scroll could not be found. <a href="./">Return to the archive.</a></p>';
      document.getElementById('postTitle').textContent = 'Scroll Not Found';
    });
  }

  initTheme();
  renderIndex();
  renderPost();
})();
