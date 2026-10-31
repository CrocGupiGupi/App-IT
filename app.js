'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }
};
const progress = () => store.get('progress', {});
const setProgress = (key, patch) => { const p = progress(); p[key] = { ...p[key], ...patch }; store.set('progress', p); };

const cache = new Map();
async function load(path, type = 'json') {
  if (cache.has(path)) return cache.get(path);
  const r = await fetch(path);
  if (!r.ok) throw new Error('No se pudo cargar ' + path);
  const v = type === 'json' ? await r.json() : await r.text();
  cache.set(path, v);
  return v;
}
const course = id => load(`content/${id}/course.json`);
const fieldIds = () => load('content/fields.json');

/* ---------- Markdown mínimo ---------- */
function inline(s) {
  s = esc(s);
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
       .replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
       .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => '<code>' + codes[i] + '</code>');
}

const LIST_RE = /^(\s*)([-*]|\d+\.)\s+(.*)/;
function md(src) {
  const L = src.replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;
  while (i < L.length) {
    const l = L[i];
    let m;
    if (/^```/.test(l)) {
      const buf = [];
      i++;
      while (i < L.length && !/^```/.test(L[i])) buf.push(L[i++]);
      i++;
      out.push(`<div class="pre"><pre><code>${esc(buf.join('\n'))}</code></pre></div>`);
    } else if (!l.trim()) {
      i++;
    } else if ((m = l.match(/^(#{1,4})\s+(.*)/))) {
      out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
      i++;
    } else if (/^---+\s*$/.test(l)) {
      out.push('<hr>');
      i++;
    } else if (/^>/.test(l)) {
      const buf = [];
      while (i < L.length && /^>/.test(L[i])) buf.push(L[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${md(buf.join('\n'))}</blockquote>`);
    } else if (/^\|/.test(l) && /^\|?\s*:?-{2,}/.test(L[i + 1] || '')) {
      const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(l);
      i += 2;
      const rows = [];
      while (i < L.length && /^\|/.test(L[i])) rows.push(cells(L[i++]));
      out.push('<div class="tablewrap"><table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
        rows.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>');
    } else if (LIST_RE.test(l)) {
      const items = [];
      while (i < L.length && LIST_RE.test(L[i])) {
        const mm = L[i].match(LIST_RE);
        const item = { nested: mm[1].length >= 2, ord: /\d/.test(mm[2]), t: mm[3] };
        const last = items[items.length - 1];
        if (item.nested && last) last.kids.push(item); else items.push({ ...item, kids: [] });
        i++;
      }
      const tag = it => (it.ord ? 'ol' : 'ul');
      const sub = kids => kids.length ? `<${tag(kids[0])}>${kids.map(k => `<li>${inline(k.t)}</li>`).join('')}</${tag(kids[0])}>` : '';
      out.push(`<${tag(items[0])}>${items.map(it => `<li>${inline(it.t)}${sub(it.kids)}</li>`).join('')}</${tag(items[0])}>`);
    } else {
      const buf = [];
      while (i < L.length && L[i].trim() && !/^(```|#{1,4}\s|>|\|)/.test(L[i]) && !LIST_RE.test(L[i]) && !/^---+\s*$/.test(L[i])) buf.push(L[i++]);
      if (!buf.length) { buf.push(L[i++]); }
      out.push(`<p>${inline(buf.join(' '))}</p>`);
    }
  }
  return out.join('\n');
}

/* ---------- Test ---------- */
function quizHTML(qs) {
  return qs.map((q, i) => {
    const multi = Array.isArray(q.answer);
    return `<fieldset class="q" data-i="${i}"><legend><span class="n">${i + 1}.</span> ${inline(q.q)}` +
      (multi ? ` <span class="hint">(elige ${q.answer.length})</span>` : '') + '</legend>' +
      q.options.map((o, j) => `<label class="opt"><input type="${multi ? 'checkbox' : 'radio'}" name="q${i}" value="${j}"><span>${inline(o)}</span></label>`).join('') +
      '<div class="fb" hidden></div></fieldset>';
  }).join('');
}

function gradeQuiz(root, qs) {
  let ok = 0;
  qs.forEach((q, i) => {
    const fs = $(`[data-i="${i}"]`, root);
    const right = [].concat(q.answer);
    const want = [...right].sort().join();
    const got = [...fs.querySelectorAll('input:checked')].map(x => +x.value).sort().join();
    const good = want === got;
    if (good) ok++;
    fs.classList.add(good ? 'good' : 'bad');
    fs.querySelectorAll('.opt').forEach((l, j) => l.classList.toggle('right', right.includes(j)));
    fs.querySelectorAll('input').forEach(x => { x.disabled = true; });
    const fb = $('.fb', fs);
    fb.hidden = false;
    fb.innerHTML = (good ? '✔ Correcto. ' : '✘ Incorrecto. ') + inline(q.explain || '');
  });
  return ok;
}

function mountQuiz(box, qs, onDone) {
  const draw = () => {
    box.innerHTML = quizHTML(qs) + '<div class="row"><button class="btn" type="button" id="check">Comprobar</button></div><p class="score" aria-live="polite"></p>';
    $('#check', box).onclick = () => {
      const ok = gradeQuiz(box, qs);
      $('.score', box).textContent = `Resultado: ${ok} / ${qs.length}`;
      $('#check', box).outerHTML = '<button class="btn ghost" type="button" id="retry">Reintentar</button>';
      $('#retry', box).onclick = draw;
      if (onDone) onDone(ok, qs.length);
    };
  };
  draw();
}

const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- Vistas ---------- */
const main = $('#main');
const show = html => { main.innerHTML = html; window.scrollTo(0, 0); main.focus({ preventScroll: true }); };
const doneCount = c => c.lessons.filter(l => progress()[`${c.id}/${l.id}`]?.done).length;

async function renderNav(cur) {
  const courses = await Promise.all((await fieldIds()).map(course));
  $('#nav').innerHTML = '<h2>Campos</h2>' + courses.map(c => {
    const open = c.id === cur.fid;
    return `<a class="field${open && !cur.lid ? ' cur' : ''}" href="#/f/${c.id}"><span>${c.icon} ${esc(c.title)}</span><span class="muted">${doneCount(c)}/${c.lessons.length}</span></a>` +
      (open ? '<div class="lessons">' + c.lessons.map(l => {
        const d = progress()[`${c.id}/${l.id}`]?.done;
        return `<a href="#/f/${c.id}/${l.id}" class="${l.id === cur.lid ? 'cur' : ''}"><span class="tick">${d ? '✔' : ''}</span><span>${esc(l.title)}</span></a>`;
      }).join('') + `<a href="#/f/${c.id}/repaso" class="${cur.lid === 'repaso' ? 'cur' : ''}"><span class="tick"></span><span>Repaso aleatorio</span></a></div>` : '');
  }).join('');
}

async function home() {
  const courses = await Promise.all((await fieldIds()).map(course));
  show('<h1>Estudio IT</h1><p class="muted">Elige un campo. Tu progreso se guarda en este navegador.</p><div class="cards">' +
    courses.map(c => {
      const pct = Math.round(100 * doneCount(c) / c.lessons.length);
      return `<a class="card" href="#/f/${c.id}"><div class="ico">${c.icon}</div><h2>${esc(c.title)}</h2><p class="muted">${esc(c.description)}</p>` +
        `<div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div><small class="muted">${doneCount(c)} de ${c.lessons.length} lecciones</small></a>`;
    }).join('') + '</div>');
}

async function courseView(fid) {
  const c = await course(fid);
  const levels = [...new Set(c.lessons.map(l => l.level))];
  show(`<h1>${c.icon} ${esc(c.title)}</h1><p>${esc(c.description)}</p>` +
    '<p><strong>Certificaciones relacionadas:</strong><br>' + c.certs.map(x => `<span class="badge">${esc(x)}</span>`).join('') + '</p>' +
    (c.note ? `<blockquote>${inline(c.note)}</blockquote>` : '') +
    levels.map(lv => `<section class="lvl"><h2>${esc(lv)}</h2><ul class="list">` +
      c.lessons.filter(l => l.level === lv).map(l => {
        const d = progress()[`${fid}/${l.id}`];
        return `<li><a href="#/f/${fid}/${l.id}"><span>${d?.done ? '✔ ' : ''}${esc(l.title)}</span><small class="muted">${l.minutes} min${d?.score != null ? ` · test ${d.score}/${d.of}` : ''}</small></a></li>`;
      }).join('') + '</ul></section>').join('') +
    `<div class="row"><a class="btn" href="#/f/${fid}/repaso">Repaso aleatorio (10 preguntas)</a></div>`);
}

async function lessonView(fid, lid) {
  const c = await course(fid);
  const idx = c.lessons.findIndex(l => l.id === lid);
  if (idx < 0) return show('<p>Lección no encontrada. <a href="#/">Inicio</a></p>');
  const l = c.lessons[idx];
  const key = `${fid}/${lid}`;
  const [text, quiz] = await Promise.all([load(`content/${fid}/${l.file}`, 'text'), load(`content/${fid}/quiz.json`).catch(() => ({}))]);
  const qs = quiz[lid] || [];
  const prev = c.lessons[idx - 1], next = c.lessons[idx + 1];
  const done = progress()[key]?.done;
  show(`<p><a href="#/f/${fid}">← ${esc(c.title)}</a> · <span class="muted">${esc(l.level)} · ${l.minutes} min</span></p>` + md(text) +
    (qs.length ? '<section class="quiz"><h2>Test de la lección</h2><div id="quiz"></div></section>' : '') +
    `<div class="row"><button class="btn${done ? ' ghost' : ''}" type="button" id="done">${done ? '✔ Completada (desmarcar)' : 'Marcar como completada'}</button></div>` +
    '<div class="nav2">' + (prev ? `<a href="#/f/${fid}/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>') +
    (next ? `<a href="#/f/${fid}/${next.id}">${esc(next.title)} →</a>` : `<a href="#/f/${fid}/repaso">Repaso aleatorio →</a>`) + '</div>');
  if (qs.length) mountQuiz($('#quiz'), qs, (ok, of) => { setProgress(key, { score: ok, of }); renderNav({ fid, lid }); });
  $('#done').onclick = () => { setProgress(key, { done: !done }); lessonView(fid, lid); renderNav({ fid, lid }); };
  main.querySelectorAll('.pre').forEach(p => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'copy'; b.textContent = 'Copiar';
    b.onclick = async () => { try { await navigator.clipboard.writeText($('code', p).textContent); b.textContent = '¡Copiado!'; } catch { b.textContent = 'Error'; } setTimeout(() => { b.textContent = 'Copiar'; }, 1500); };
    p.appendChild(b);
  });
}

async function reviewView(fid) {
  const c = await course(fid);
  const quiz = await load(`content/${fid}/quiz.json`).catch(() => ({}));
  const qs = shuffle(Object.values(quiz).flat()).slice(0, 10);
  show(`<p><a href="#/f/${fid}">← ${esc(c.title)}</a></p><h1>Repaso aleatorio</h1><p class="muted">Preguntas mezcladas de todo el campo.</p><div id="quiz"></div>` +
    `<div class="row"><a class="btn ghost" href="#/f/${fid}/repaso" onclick="setTimeout(()=>location.reload())">Nuevo repaso</a></div>`);
  mountQuiz($('#quiz'), qs);
}

async function router() {
  document.body.classList.remove('navopen');
  $('#scrim').hidden = true;
  $('#menu').setAttribute('aria-expanded', 'false');
  const [, kind, fid, lid] = location.hash.split('/');
  try {
    await renderNav({ fid: kind === 'f' ? fid : null, lid });
    if (kind !== 'f') await home();
    else if (!lid) await courseView(fid);
    else if (lid === 'repaso') await reviewView(fid);
    else await lessonView(fid, lid);
  } catch (e) {
    show(`<p>No se pudo cargar el contenido (${esc(e.message)}). <a href="#/">Volver al inicio</a></p>`);
  }
}

$('#menu').onclick = () => {
  const open = document.body.classList.toggle('navopen');
  $('#scrim').hidden = !open;
  $('#menu').setAttribute('aria-expanded', String(open));
};
$('#scrim').onclick = () => $('#menu').click();
window.addEventListener('hashchange', router);
router();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
