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

/* ---------- Actividad ---------- */
const today = (d = new Date()) => d.toLocaleDateString('en-CA');
function touch() {
  const p = progress();
  p._dias = [...new Set([...(p._dias || []), today()])].slice(-400);
  store.set('progress', p);
}
function streak() {
  const days = new Set(progress()._dias || []);
  const d = new Date();
  if (!days.has(today(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(today(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ---------- Test: una pregunta por pantalla ---------- */
function mountQuiz(box, qs, opts = {}) {
  const { exam = false, onDone, onRetry, retryLabel = 'Repetir test' } = opts;
  let at = 0, ended = false;
  const picks = qs.map(() => []), seen = qs.map(() => false);
  const rightOf = q => [].concat(q.answer);
  const isGood = i => [...rightOf(qs[i])].sort().join() === [...picks[i]].sort().join();

  const steps = () => '<ol class="steps" aria-hidden="true">' + qs.map((_, i) => {
    const cls = i === at ? 'now-q' : exam ? (picks[i].length ? 'ans' : '') : seen[i] ? (isGood(i) ? 'ok' : 'ko') : '';
    return `<li class="${cls}"></li>`;
  }).join('') + '</ol>';

  const draw = focus => {
    const q = qs[at], multi = Array.isArray(q.answer), right = rightOf(q);
    const shown = !exam && seen[at], last = at === qs.length - 1;
    const good = shown && isGood(at);
    const optHTML = q.options.map((o, j) => {
      const chosen = picks[at].includes(j), isRight = right.includes(j);
      const cls = shown ? (isRight ? ' right' : chosen ? ' wrong' : '') : '';
      const mark = shown && (isRight || chosen) ? `<span class="mark">${isRight ? 'Correcta' : 'Tu respuesta'}</span>` : '';
      return `<label class="opt${cls}"><input type="${multi ? 'checkbox' : 'radio'}" name="a" value="${j}"${chosen ? ' checked' : ''}><span>${inline(o)}</span>${mark}</label>`;
    }).join('');
    const actions = exam
      ? (at ? '<button class="btn ghost" type="button" id="prev">Anterior</button>' : '') +
        `<button class="btn" type="submit">${last ? 'Terminar y corregir' : 'Siguiente'}</button>`
      : `<button class="btn" type="submit">${!shown ? 'Comprobar' : last ? 'Ver resultado' : 'Siguiente pregunta'}</button>`;
    box.innerHTML = `<form class="ask" novalidate>${steps()}<p class="count">Pregunta ${at + 1} de ${qs.length}</p>` +
      `<fieldset${shown ? ' disabled' : ''}><legend><span tabindex="-1">${inline(q.q)}</span>${multi && !/elige/i.test(q.q) ? ` <span class="hint">Elige ${right.length}</span>` : ''}</legend><div class="opts">${optHTML}</div></fieldset>` +
      '<p class="need" role="alert" hidden>Elige una respuesta para comprobarla.</p>' +
      (shown ? `<div class="fb ${good ? 'ok' : 'ko'}" tabindex="-1"><strong>${good ? 'Correcto' : 'Incorrecto'}</strong>${inline(q.explain || '')}</div>` : '') +
      `<div class="row">${actions}</div></form>`;
    const form = $('form', box);
    form.addEventListener('change', () => {
      picks[at] = [...form.querySelectorAll('input:checked')].map(x => +x.value);
      if (exam) $('.steps', box).outerHTML = steps();
      $('.need', box).hidden = true;
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!exam && !shown) {
        if (!picks[at].length) { $('.need', box).hidden = false; return; }
        seen[at] = true;
        return draw('.fb');
      }
      if (last) return finish();
      at++;
      draw('legend span');
    });
    if (exam && at) $('#prev', box).onclick = () => { at--; draw('legend span'); };
    if (focus) {
      $(focus, box).focus({ preventScroll: true });
      box.scrollIntoView({ block: 'nearest' });
    }
  };

  const finish = () => {
    if (ended) return;
    ended = true;
    qs.forEach((q, i) => { q._good = isGood(i); });
    const ok = qs.filter(q => q._good).length, pct = Math.round(100 * ok / qs.length);
    const fails = qs.filter(q => !q._good);
    box.innerHTML = `<div class="result"><p class="big" tabindex="-1">${pct} %</p><p>${ok} de ${qs.length} correctas</p>` +
      (fails.length ? '<h3>Preguntas falladas</h3><ul class="fails">' + fails.map(q =>
        `<li><p><strong>${inline(q.q)}</strong></p><p>Correcta: ${rightOf(q).map(j => inline(q.options[j])).join('; ')}</p>${q.explain ? `<p class="muted">${inline(q.explain)}</p>` : ''}</li>`).join('') + '</ul>' : '') +
      `<div class="row"><button class="btn" type="button" id="retry">${retryLabel}</button></div></div>`;
    $('#retry', box).onclick = () => (onRetry ? onRetry() : mountQuiz(box, qs, opts));
    $('.big', box).focus({ preventScroll: true });
    box.scrollIntoView({ block: 'nearest' });
    if (onDone) onDone(ok, qs.length);
  };

  draw();
  return finish;
}

const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- Piezas de la ruta ---------- */
const main = $('#main');
let lineIds = [];
const show = (html, width = 'read') => { main.className = width; main.innerHTML = html; window.scrollTo(0, 0); main.focus({ preventScroll: true }); };
const isDone = (fid, lid) => !!progress()[`${fid}/${lid}`]?.done;
const doneCount = c => c.lessons.filter(l => isDone(c.id, l.id)).length;
const lineVar = id => `--line:var(--l${Math.max(lineIds.indexOf(id), 0) % 6})`;
const lineTag = (c, big) => `<span class="line${big ? ' big' : ''}" style="${lineVar(c.id)}" aria-hidden="true">${esc(c.id.slice(0, 2).replace(/^./, s => s.toUpperCase()))}</span>`;
const firstOpen = c => c.lessons.find(l => !isDone(c.id, l.id));

function track(c, lid, draw) {
  const next = firstOpen(c)?.id;
  return `<ol class="track${draw ? ' draw' : ''}" style="${lineVar(c.id)}" aria-label="Lecciones de ${esc(c.title)}">` + c.lessons.map((l, i) => {
    const done = isDone(c.id, l.id), cur = l.id === lid;
    const cls = [done && 'done', cur && 'cur', !lid && l.id === next && 'next'].filter(Boolean).join(' ');
    return `<li class="${cls}"><a href="#/f/${c.id}/${l.id}" title="${esc(l.title)}" aria-label="${i + 1}. ${esc(l.title)}${done ? ', completada' : ''}"${cur ? ' aria-current="page"' : ''}></a></li>`;
  }).join('') + '</ol>';
}

function nextLesson(courses) {
  const last = store.get('last', null);
  const c = last && courses.find(x => x.id === last.fid);
  if (c) {
    if (c.lessons.some(l => l.id === last.lid) && !isDone(c.id, last.lid)) return { c, l: c.lessons.find(l => l.id === last.lid) };
    if (firstOpen(c)) return { c, l: firstOpen(c) };
  }
  for (const x of courses) if (firstOpen(x)) return { c: x, l: firstOpen(x) };
  return null;
}

const THEMES = [['auto', 'Auto'], ['light', 'Claro'], ['dark', 'Oscuro']];
function applyTheme() {
  const t = store.get('theme', 'auto'), root = document.documentElement;
  if (t === 'auto') delete root.dataset.theme; else root.dataset.theme = t;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('meta[name=theme-color]').content = dark ? '#142c37' : '#f8fbfb';
}

async function renderNav(cur) {
  const courses = await Promise.all((await fieldIds()).map(course));
  const theme = store.get('theme', 'auto');
  $('#nav').innerHTML = '<a class="brand" href="#/"><img src="icon.svg" alt="" width="26" height="26">Estudio IT</a>' +
    '<form id="search" role="search"><input type="search" name="q" autocomplete="off" placeholder="Buscar en el temario…" aria-label="Buscar en el temario" value="' + esc(cur.q || '') + '"></form>' +
    '<div class="navlist"><h2 class="navh">Rutas</h2>' + courses.map(c => {
      const open = c.id === cur.fid;
      return `<a class="field${open && !cur.lid ? ' cur' : ''}" href="#/f/${c.id}">${lineTag(c)}<span>${esc(c.title)}</span><small>${doneCount(c)}/${c.lessons.length}</small></a>` +
        (open ? `<ol class="sub" style="${lineVar(c.id)}">` + c.lessons.map(l =>
          `<li class="${isDone(c.id, l.id) ? 'done' : ''}"><a href="#/f/${c.id}/${l.id}"${l.id === cur.lid ? ' aria-current="page"' : ''}>${esc(l.title)}</a></li>`).join('') + '</ol>' : '');
    }).join('') + `<a class="field plain${cur.certs ? ' cur' : ''}" href="#/certificaciones"><span>Certificaciones y precios</span></a></div>` +
    '<div class="theme" role="group" aria-label="Tema">' + THEMES.map(([v, t]) => `<button type="button" data-theme-set="${v}" aria-pressed="${v === theme}">${t}</button>`).join('') + '</div>';
}

/* ---------- Vistas ---------- */
let drawn = false;
async function home() {
  const courses = await Promise.all((await fieldIds()).map(course));
  const all = courses.flatMap(c => c.lessons.map(l => ({ c, l, d: progress()[`${c.id}/${l.id}`] })));
  const done = all.filter(x => x.d?.done).length;
  const tested = all.filter(x => x.d?.of);
  const hit = tested.length ? Math.round(100 * tested.reduce((s, x) => s + x.d.score, 0) / tested.reduce((s, x) => s + x.d.of, 0)) : null;
  const weak = tested.filter(x => x.d.score / x.d.of < .7).sort((a, b) => a.d.score / a.d.of - b.d.score / b.d.of).slice(0, 3);
  const next = nextLesson(courses), days = streak();
  const hero = next
    ? `<div><h1>${done ? 'Sigue con' : 'Empieza por'} ${esc(next.l.title)}</h1><p class="muted">${esc(next.c.title)}, ${next.l.minutes} minutos</p></div>` +
      `<a class="btn tone" style="${lineVar(next.c.id)}" href="#/f/${next.c.id}/${next.l.id}">Abrir lección</a>`
    : `<div><h1>Has completado todas las lecciones</h1><p class="muted">Comprueba lo aprendido con un simulacro.</p></div><a class="btn" href="#/f/${courses[0].id}/simulacro">Hacer simulacro</a>`;
  show(`<section class="now">${hero}</section>` +
    '<dl class="stats">' +
    `<div><dt>lecciones completadas de ${all.length}</dt><dd>${done}</dd></div>` +
    `<div><dt>${days === 1 ? 'día seguido' : 'días seguidos'} estudiando</dt><dd>${days}</dd></div>` +
    `<div><dt>${hit === null ? 'de acierto: haz un test para empezar' : 'de acierto en los tests'}</dt><dd>${hit === null ? '–' : hit + ' %'}</dd></div></dl>` +
    '<h2>Tus rutas</h2><ul class="map">' + courses.map(c =>
      `<li class="lane"><a href="#/f/${c.id}">${lineTag(c)}<span>${esc(c.title)}</span><small>${doneCount(c)} de ${c.lessons.length}</small></a>${track(c, null, !drawn)}</li>`).join('') + '</ul>' +
    (weak.length ? '<h2>Conviene repasar</h2><ul class="list">' + weak.map(x =>
      `<li><a href="#/f/${x.c.id}/${x.l.id}"><span>${esc(x.l.title)}</span><small>${x.d.score} de ${x.d.of} en el test</small></a></li>`).join('') + '</ul>' : '') +
    '<details class="tools"><summary>Copia de tu progreso</summary><p>El progreso se guarda solo en este navegador. Exporta una copia para pasarla a otro dispositivo.</p>' +
    '<div class="row"><button class="btn ghost" type="button" id="exp">Exportar progreso</button><button class="btn ghost" type="button" id="imp">Importar progreso</button><input type="file" id="file" accept="application/json" hidden></div></details>', 'wide');
  drawn = true;
  dataTools();
}

async function courseView(fid) {
  const c = await course(fid);
  const levels = [...new Set(c.lessons.map(l => l.level))];
  const open = firstOpen(c), left = c.lessons.filter(l => !isDone(fid, l.id)).reduce((s, l) => s + l.minutes, 0);
  show(`<div class="head">${lineTag(c, true)}<div><h1>${esc(c.title)}</h1><p class="muted">${doneCount(c)} de ${c.lessons.length} lecciones${left ? `, quedan ${left} minutos` : ''}</p></div></div>` +
    `<p>${esc(c.description)}</p>` +
    `<div class="row">${open ? `<a class="btn" href="#/f/${fid}/${open.id}">${doneCount(c) ? 'Seguir' : 'Empezar'} la ruta</a>` : ''}<a class="btn ghost" href="#/f/${fid}/repaso">Repaso de 10 preguntas</a><a class="btn ghost" href="#/f/${fid}/simulacro">Simulacro cronometrado</a></div>` +
    '<div class="split"><div>' + levels.map(lv => `<section class="zone"><h2>${esc(lv)}</h2><ol class="route">` +
      c.lessons.filter(l => l.level === lv).map(l => {
        const d = progress()[`${fid}/${l.id}`];
        const cls = [d?.done && 'done', l.id === open?.id && 'next'].filter(Boolean).join(' ');
        return `<li class="${cls}"><a href="#/f/${fid}/${l.id}"><span>${esc(l.title)}${d?.done ? '<span class="sr">, completada</span>' : ''}</span><small>${d?.of ? `${d.score}/${d.of}, ` : ''}${l.minutes} min</small></a></li>`;
      }).join('') + '</ol></section>').join('') + '</div>' +
    `<aside class="side"><h2>Certificaciones</h2>${certList(c)}` +
    (c.note ? `<blockquote><p>${inline(c.note)}</p></blockquote>` : '') + '</aside></div>', 'wide');
}

function certList(c) {
  return '<ul class="certs">' + c.certs.map(x =>
    `<li><a href="${esc(x.url)}" target="_blank" rel="noopener"><strong>${esc(x.code)}</strong> ${esc(x.name)}<span class="sr"> (abre la web oficial)</span></a><b>${esc(x.price)}</b>` +
    `<small>${[x.format, x.info].filter(Boolean).map(esc).join('. ')}</small></li>`).join('') + '</ul>' +
    (c.related?.length ? `<p class="muted">${c.related.map(esc).join('. ')}.</p>` : '') +
    `<p class="muted fine">${esc(c.certsNote)}</p>`;
}

async function certsView() {
  const courses = await Promise.all((await fieldIds()).map(course));
  show('<h1>Certificaciones y precios</h1><p class="muted">Cada examen enlaza a su web oficial. Confirma allí el precio y el idioma antes de reservar.</p>' +
    courses.map(c => `<section class="certgroup"><h2>${lineTag(c)} <a href="#/f/${c.id}">${esc(c.title)}</a></h2>${certList(c)}</section>`).join(''));
}

async function lessonView(fid, lid) {
  const c = await course(fid);
  const idx = c.lessons.findIndex(l => l.id === lid);
  if (idx < 0) return show('<p>Esta lección no existe. <a href="#/">Volver al inicio</a></p>');
  const l = c.lessons[idx];
  const key = `${fid}/${lid}`;
  const [text, quiz] = await Promise.all([load(`content/${fid}/${l.file}`, 'text'), load(`content/${fid}/quiz.json`).catch(() => ({}))]);
  const qs = quiz[lid] || [];
  const prev = c.lessons[idx - 1], next = c.lessons[idx + 1];
  const done = progress()[key]?.done;
  store.set('last', { fid, lid });
  show(`<div class="crumb"><a href="#/f/${fid}">${esc(c.title)}</a><p class="muted">Lección ${idx + 1} de ${c.lessons.length}, ${esc(l.level.toLowerCase())}, ${l.minutes} minutos</p>${track(c, lid)}</div>` + md(text) +
    (qs.length ? '<section class="after"><h2>Test de la lección</h2><div id="quiz"></div></section>' : '') +
    `<div class="row"><button class="btn${done ? ' ghost' : ''}" type="button" id="done">${done ? 'Desmarcar como completada' : 'Marcar como completada'}</button></div>` +
    '<div class="nav2">' + (prev ? `<a href="#/f/${fid}/${prev.id}"><small>Anterior</small>${esc(prev.title)}</a>` : '') +
    (next ? `<a class="fwd" href="#/f/${fid}/${next.id}"><small>Siguiente</small>${esc(next.title)}</a>` : `<a class="fwd" href="#/f/${fid}/repaso"><small>Fin de la ruta</small>Repaso de 10 preguntas</a>`) + '</div>');
  if (qs.length) mountQuiz($('#quiz'), qs, { onDone: (ok, of) => { setProgress(key, { score: ok, of }); touch(); renderNav({ fid, lid }); } });
  $('#done').onclick = () => { setProgress(key, { done: !done }); if (!done) touch(); lessonView(fid, lid); renderNav({ fid, lid }); };
  main.querySelectorAll('.pre').forEach(p => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'copy'; b.textContent = 'Copiar';
    b.onclick = async () => { try { await navigator.clipboard.writeText($('code', p).textContent); b.textContent = 'Copiado'; } catch { b.textContent = 'No se pudo copiar'; } setTimeout(() => { b.textContent = 'Copiar'; }, 1500); };
    p.appendChild(b);
  });
}

async function reviewView(fid) {
  const c = await course(fid);
  const quiz = await load(`content/${fid}/quiz.json`).catch(() => ({}));
  const qs = shuffle(Object.values(quiz).flat()).slice(0, 10);
  show(`<div class="crumb"><a href="#/f/${fid}">${esc(c.title)}</a></div><h1>Repaso aleatorio</h1><p class="muted">Preguntas mezcladas de todo el campo, con la respuesta al momento.</p><div id="quiz"></div>`);
  mountQuiz($('#quiz'), qs, { onDone: touch, onRetry: () => reviewView(fid), retryLabel: 'Nuevo repaso' });
}

let timer = null;
const stopTimer = () => { clearInterval(timer); timer = null; };

async function mockView(fid) {
  const c = await course(fid);
  const quiz = await load(`content/${fid}/quiz.json`).catch(() => ({}));
  const all = Object.entries(quiz).flatMap(([lesson, qs]) => qs.map(q => ({ ...q, lesson })));
  const qs = shuffle(all).slice(0, Math.min(20, all.length));
  const total = qs.length * 90; // 90 s por pregunta
  show(`<div class="crumb"><a href="#/f/${fid}">${esc(c.title)}</a></div><h1>Simulacro cronometrado</h1>` +
    `<p class="muted">${qs.length} preguntas en ${Math.round(total / 60)} minutos. Verás el resultado al terminar. Si se acaba el tiempo, se corrige solo.</p>` +
    '<p class="timer" role="timer" aria-live="off" aria-label="Tiempo restante"><span id="clock"></span></p><div id="quiz"></div><div id="weak"></div>');
  let left = total;
  const draw = () => { $('#clock').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; };
  draw();
  const finish = mountQuiz($('#quiz'), qs, {
    exam: true,
    retryLabel: 'Nuevo simulacro',
    onRetry: () => mockView(fid),
    onDone: () => {
      stopTimer();
      touch();
      const titles = Object.fromEntries(c.lessons.map(l => [l.id, l.title]));
      const miss = {};
      qs.filter(q => !q._good).forEach(q => { miss[q.lesson] = (miss[q.lesson] || 0) + 1; });
      const rows = Object.entries(miss).sort((a, b) => b[1] - a[1]);
      if (rows.length) $('#weak').innerHTML = '<h2>Lecciones que repasar</h2><ul class="list">' + rows.map(([id, n]) =>
        `<li><a href="#/f/${fid}/${id}"><span>${esc(titles[id] || id)}</span><small>${n} ${n > 1 ? 'fallos' : 'fallo'}</small></a></li>`).join('') + '</ul>';
    }
  });
  timer = setInterval(() => {
    left--; draw();
    if (left <= 0) { stopTimer(); finish(); }
  }, 1000);
}

let searchIndex = null;
async function searchView(q) {
  show(`<h1>Resultados para «${esc(q)}»</h1><p class="muted" id="st" role="status">Buscando…</p><ul class="list" id="sr"></ul>`);
  if (!searchIndex) {
    const courses = await Promise.all((await fieldIds()).map(course));
    searchIndex = (await Promise.all(courses.flatMap(c => c.lessons.map(async l => ({
      fid: c.id, field: c.title, id: l.id, title: l.title, text: await load(`content/${c.id}/${l.file}`, 'text').catch(() => '')
    }))))).filter(Boolean);
  }
  const term = q.toLowerCase();
  const hits = searchIndex.map(d => {
    const i = d.text.toLowerCase().indexOf(term);
    const inTitle = d.title.toLowerCase().includes(term);
    return (i >= 0 || inTitle) ? { d, i, score: (inTitle ? 2 : 0) + (i >= 0 ? 1 : 0) } : null;
  }).filter(Boolean).sort((a, b) => b.score - a.score);
  $('#st').textContent = hits.length ? (hits.length === 1 ? '1 lección' : `${hits.length} lecciones`) : 'Sin resultados. Prueba con otra palabra.';
  $('#sr').innerHTML = hits.map(({ d, i }) => {
    const snip = i >= 0 ? '…' + d.text.slice(Math.max(0, i - 50), i + 90).replace(/[#*`|>\n]+/g, ' ') + '…' : '';
    return `<li><a href="#/f/${d.fid}/${d.id}"><span><strong>${esc(d.title)}</strong><small class="muted">${esc(snip)}</small></span><small>${esc(d.field)}</small></a></li>`;
  }).join('');
}

function dataTools() {
  $('#exp').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(progress(), null, 2)], { type: 'application/json' }));
    a.download = 'estudio-it-progreso.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  $('#imp').onclick = () => $('#file').click();
  $('#file').onchange = async e => {
    try {
      const data = JSON.parse(await e.target.files[0].text());
      if (typeof data !== 'object' || Array.isArray(data) || !data) throw new Error('formato');
      const cur = progress();
      store.set('progress', { ...cur, ...data, _dias: [...new Set([...(cur._dias || []), ...(data._dias || [])])].sort() });
      router();
    } catch { alert('El fichero no es un progreso válido.'); }
  };
}

async function router() {
  document.body.classList.remove('navopen');
  $('#scrim').hidden = true;
  $('#menu').setAttribute('aria-expanded', 'false');
  stopTimer();
  const [, kind, fid, lid] = location.hash.split('/');
  try {
    lineIds = await fieldIds();
    const inField = kind === 'f' && fid;
    document.body.classList.toggle('tone', !!inField);
    document.body.style.cssText = inField ? lineVar(fid) : '';
    const q = kind === 'buscar' ? decodeURIComponent(fid || '') : '';
    await renderNav({ fid: kind === 'f' ? fid : null, lid, q, certs: kind === 'certificaciones' });
    if (kind === 'buscar' && q.trim()) await searchView(q.trim());
    else if (kind === 'certificaciones') await certsView();
    else if (kind !== 'f') await home();
    else if (!lid) await courseView(fid);
    else if (lid === 'repaso') await reviewView(fid);
    else if (lid === 'simulacro') await mockView(fid);
    else await lessonView(fid, lid);
  } catch (e) {
    show(`<p>No se pudo cargar el contenido (${esc(e.message)}). <a href="#/">Volver al inicio</a></p>`);
  }
}

$('#menu').onclick = () => {
  const open = document.body.classList.toggle('navopen');
  $('#scrim').hidden = !open;
  $('#menu').setAttribute('aria-expanded', String(open));
  if (open) $('#nav a').focus();
};
$('#scrim').onclick = () => $('#menu').click();
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.body.classList.contains('navopen')) { $('#menu').click(); $('#menu').focus(); }
});
$('#skip').onclick = e => { e.preventDefault(); main.focus(); };
$('#nav').addEventListener('submit', e => {
  e.preventDefault();
  const v = new FormData(e.target).get('q').trim();
  if (v) location.hash = '#/buscar/' + encodeURIComponent(v);
});
$('#nav').addEventListener('click', e => {
  const b = e.target.closest('[data-theme-set]');
  if (!b) return;
  store.set('theme', b.dataset.themeSet);
  applyTheme();
  $('#nav').querySelectorAll('[data-theme-set]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
window.addEventListener('hashchange', router);
applyTheme();
router();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
