
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');
const json = async file => JSON.parse(await read(file));
const app = await read('app.js');
const sw = await read('sw.js');
const marker = '/* ---------- Actividad ---------- */';
const rendererEnd = app.indexOf(marker);
assert(rendererEnd > 0, 'No se localiza el final del renderizador');
const render = vm.runInNewContext(app.slice(0, rendererEnd) + '\nmd');
const fields = await json('content/fields.json');
assert(Array.isArray(fields) && fields.length && fields.length === new Set(fields).size);
const assets = [
  './', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'icon.svg',
  'content/fields.json'
];
const manifest = await json('manifest.webmanifest');
for (const icon of manifest.icons) assets.push(icon.src);
const css = await read('styles.css');
for (const [, font] of css.matchAll(/url\(['"]?(fonts\/[^)'"]+)['"]?\)/g)) assets.push(font);

let lessonCount = 0;
let questionCount = 0;
for (const id of fields) {
  assert.match(id, /^[a-z0-9-]+$/);
  const dir = 'content/' + id + '/';
  const course = await json(dir + 'course.json');
  const quiz = await json(dir + 'quiz.json');
  assert.equal(course.id, id);
  assert(course.lessons.length > 0, id + ': sin lecciones');
  assets.push(dir + 'course.json', dir + 'quiz.json');
  const lessonIds = new Set();
  for (const lesson of course.lessons) {
    const label = id + '/' + lesson.id;
    assert(!lessonIds.has(lesson.id), label + ': ID duplicado');
    lessonIds.add(lesson.id);
    assert.match(lesson.file, /^[a-z0-9-]+\.md$/);
    const file = dir + lesson.file;
    assets.push(file);
    const markdown = await read(file);
    const html = render(markdown);
    const fences = [...markdown.matchAll(/^(?:> ?)* *\x60{3}/gm)].length;
    assert.equal(fences % 2, 0, label + ': bloque sin cerrar');
    assert.equal([...html.matchAll(/<pre>/g)].length, fences / 2, label + ': bloques renderizados');
    assert.equal([...html.matchAll(/<h1>/g)].length, 1, label + ': título principal');
    assert.match(html, /<h2>Fuentes<\/h2>/, label + ': faltan fuentes');
    for (const [table] of html.matchAll(/<table>.*?<\/table>/gs)) {
      const width = [...table.matchAll(/<th>/g)].length;
      for (const [row] of table.matchAll(/<tbody>.*?<\/tbody>/gs)) {
        for (const [cells] of row.matchAll(/<tr>.*?<\/tr>/gs)) {
          assert.equal([...cells.matchAll(/<td>/g)].length, width, label + ': columnas de tabla');
        }
      }
    }
    assert(Array.isArray(quiz[lesson.id]) && quiz[lesson.id].length, label + ': falta el test');
    for (const question of quiz[lesson.id]) {
      assert(question.q?.trim() && question.explain?.trim(), label + ': pregunta o explicación vacía');
      assert(Array.isArray(question.options) && question.options.length >= 2, question.q);
      assert.equal(new Set(question.options).size, question.options.length, question.q);
      const answers = [].concat(question.answer);
      assert(answers.length && answers.length === new Set(answers).size, question.q);
      assert(answers.every(n => Number.isInteger(n) && n >= 0 && n < question.options.length), question.q);
      questionCount++;
    }
    lessonCount++;
  }
  for (const key of Object.keys(quiz)) assert(lessonIds.has(key), id + ': test huérfano ' + key);
}
console.log(fields.length + ' campos, ' + lessonCount + ' lecciones y ' + questionCount + ' preguntas validadas');

const base = 'https://example.test/App-IT/';
const urlOf = request => new URL(typeof request === 'string' ? request : request.url, base).href;
const stored = new Map();
const handlers = {};
let online = true;
const fetchLocal = async request => {
  if (!online) throw Error('Red desconectada');
  const url = urlOf(request);
  const relative = url.slice(base.length).split('?')[0] || 'index.html';
  return new Response(await readFile(fileURLToPath(new URL(relative, root))));
};
const cache = {
  async add(request) { stored.set(urlOf(request), await fetchLocal(request)); },
  async addAll(requests) { await Promise.all(requests.map(request => this.add(request))); },
  async match(request) { return stored.get(urlOf(request))?.clone(); },
  async put(request, response) { stored.set(urlOf(request), response); }
};
vm.runInNewContext(sw, {
  URL, location: new URL(base), fetch: fetchLocal, caches: { open: async () => cache },
  self: {
    addEventListener: (name, handler) => { handlers[name] = handler; },
    skipWaiting: async () => {}
  }
}, { filename: 'sw.js' });
let installation;
handlers.install({ waitUntil: promise => { installation = promise; } });
await installation;
online = false;
const uniqueAssets = [...new Set(assets)];
for (const file of uniqueAssets) {
  let result;
  handlers.fetch({
    request: { url: urlOf(file), method: 'GET' },
    respondWith: promise => { result = promise; }
  });
  assert(result, 'El service worker no intercepta ' + file);
  const response = await result;
  assert(response?.ok && (await response.arrayBuffer()).byteLength > 0, 'Falta sin red: ' + file);
}
console.log(uniqueAssets.length + ' recursos servidos sin red tras una instalación simulada');
