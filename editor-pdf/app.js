'use strict';
/* Editor PDF · Vonoa
   - pdf.js dibuja las páginas, pdf-lib escribe el PDF final.
   - Las anotaciones se guardan en coordenadas "de pantalla a escala 1" de la página
     tal como se ve (ya girada). Al guardar se convierten al espacio del PDF. */

const { PDFDocument, rgb, degrees, BlendMode, LineCapStyle, StandardFonts } = PDFLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
const norm = r => ((r % 360) + 360) % 360;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
let seq = 0;
const nid = p => p + (++seq).toString(36) + Math.random().toString(36).slice(2, 6);

// Familias: la de pantalla y la estándar del PDF. "base" = dónde cae la línea base
// dentro de una línea de 1.2em (para que el texto guardado quede donde se ve).
const FONTS = {
  helv:  { css: 'Arial, Helvetica, sans-serif',          base: 0.9465, std: [StandardFonts.Helvetica,  StandardFonts.HelveticaBold] },
  times: { css: '"Times New Roman", Times, serif',       base: 0.9375, std: [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold] },
  cour:  { css: '"Courier New", Courier, monospace',      base: 0.8665, std: [StandardFonts.Courier,    StandardFonts.CourierBold] },
};
const TOOL_TYPE = { text: 'text', edit: 'text', rect: 'rect', hl: 'hl', ink: 'ink' };

const S = {
  docs: {},          // id -> { bytes, pj, pages[], tc{} }
  pages: [],         // { key, docId, index, blank, bw, bh, orig, rot, annots[] }
  images: {},        // id -> { src, kind }
  tool: 'select',
  sel: null,         // { key, id }
  editing: null, editCtx: null,
  scale: 1,
  name: 'documento',
  hist: [], fut: [],
  dirty: false,
  defaults: {
    text: { font: 'helv', size: 14, bold: false, color: '#111111' },
    rect: { color: '#ffffff' },
    hl:   { color: '#f2e04b' },
    ink:  { color: '#111111', sw: 2 },
  },
};

const app = $('#app'), stage = $('#stage'), pagesEl = $('#pages'), thumbsEl = $('#thumbs');

/* ---------------- utilidades ---------------- */
function dims(p) {
  const R = norm(p.orig + p.rot);
  const sw = R % 180 !== 0;
  return { R, w: sw ? p.bh : p.bw, h: sw ? p.bw : p.bh };
}
const pageByKey = k => S.pages.find(p => p.key === k);
const wrapOf = k => pagesEl.querySelector(`.page[data-key="${k}"]`);
function selAnnot() {
  if (!S.sel) return null;
  const p = pageByKey(S.sel.key);
  const a = p && p.annots.find(x => x.id === S.sel.id);
  return a ? { p, a } : null;
}
function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
const toHex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
const track = (name, params) => { try { window.gtag && gtag('event', name, params || {}); } catch {} };
let toastT;
function toast(html, ms = 2600) {
  const t = $('#toast'); t.innerHTML = html; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
}

/* ---------------- historial ---------------- */
const snap = () => JSON.stringify(S.pages);
const shape = () => S.pages.map(p => p.key + ':' + p.rot).join();
function commit(before) {
  if (before === snap()) return;
  S.hist.push(before); if (S.hist.length > 150) S.hist.shift();
  S.fut = []; S.dirty = true; syncUndo();
}
function restore(json) {
  const old = shape();
  S.pages = JSON.parse(json);
  S.sel = null;
  if (old === shape()) S.pages.forEach(renderLayer); else rebuild();
  updateProps(); syncUndo(); S.dirty = true;
}
function undo() { finishEditing(); if (!S.hist.length) return; S.fut.push(snap()); restore(S.hist.pop()); }
function redo() { finishEditing(); if (!S.fut.length) return; S.hist.push(snap()); restore(S.fut.pop()); }
function syncUndo() { $('#bUndo').disabled = !S.hist.length; $('#bRedo').disabled = !S.fut.length; }

/* ---------------- abrir PDFs ---------------- */
async function loadPdf(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let pj;
  try {
    pj = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
  } catch (e) {
    if (e && e.name === 'PasswordException') throw new Error('El PDF tiene contraseña. Quítasela primero.');
    throw new Error('No se pudo leer el archivo como PDF.');
  }
  const id = nid('d');
  const d = S.docs[id] = { bytes, pj, pages: [], tc: {} };
  const out = [];
  for (let i = 0; i < pj.numPages; i++) {
    const pg = await pj.getPage(i + 1);
    d.pages[i] = pg;
    const vp = pg.getViewport({ scale: 1, rotation: 0 });
    out.push({ key: nid('p'), docId: id, index: i, bw: vp.width, bh: vp.height, orig: pg.rotate || 0, rot: 0, annots: [] });
  }
  return out;
}

async function openFile(file) {
  if (!file) return;
  if (S.dirty && S.pages.length && !confirm('¿Abrir otro PDF? Se perderán los cambios que no guardaste.')) return;
  try {
    toast('Abriendo <b>' + esc(file.name) + '</b>…', 8000);
    const pages = await loadPdf(file);
    S.docs = Object.fromEntries(Object.entries(S.docs).filter(([id]) => pages[0].docId === id));
    S.pages = pages; S.hist = []; S.fut = []; S.sel = null; S.dirty = false; S.pick = new Set();
    S.name = file.name.replace(/\.pdf$/i, '');
    $('#docName').textContent = file.name;
    app.dataset.empty = '0';
    $('#bSave').disabled = false;
    fitWidth(true);
    rebuild();
    stage.scrollTop = 0;
    syncUndo(); updateProps();
    track('pdf_abrir', { paginas: pages.length });
    toast('<b>' + pages.length + '</b> página' + (pages.length === 1 ? '' : 's') + ' listas para editar');
  } catch (e) { toast(esc(e.message), 4000); }
}

async function appendFiles(files, at) {
  const before = snap();
  const end = at == null || at >= S.pages.length;
  let pos = end ? S.pages.length : at, n = 0;
  const added = [];
  for (const f of files) {
    try { const pg = await loadPdf(f); S.pages.splice(pos, 0, ...pg); pos += pg.length; n += pg.length; added.push(...pg); }
    catch (e) { toast(esc(f.name) + ': ' + esc(e.message), 4000); }
  }
  if (!n) return;
  S.pick = new Set(added.map(p => p.key)); anchorKey = added[0].key;
  commit(before); rebuild();
  wrapOf(added[0].key).scrollIntoView({ behavior: 'smooth', block: 'start' });
  toast('Se agregaron <b>' + n + '</b> páginas ' + (end ? 'al final' : 'después de la página ' + (S.pages.indexOf(added[0]))));
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------------- dibujar páginas ---------------- */
const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
const pageObserver = new IntersectionObserver(entries => {
  for (const en of entries) {
    const wrap = en.target, cv = wrap.querySelector('canvas');
    if (en.isIntersecting) { if (!cv._done) paintPage(wrap); }
    else if (cv._done) { cv.width = cv.height = 0; cv._done = false; }   // libera memoria
  }
}, { root: stage, rootMargin: '900px 0px' });

async function paintCanvas(p, cv, scale) {
  const { w, h, R } = dims(p);
  const k = dpr();
  cv.width = Math.round(w * scale * k); cv.height = Math.round(h * scale * k);
  cv.style.width = w * scale + 'px'; cv.style.height = h * scale + 'px';
  const ctx = cv.getContext('2d', { willReadFrequently: false });
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
  if (p.blank) return;
  const pg = S.docs[p.docId].pages[p.index];
  if (cv._task) { try { cv._task.cancel(); } catch {} }
  const task = pg.render({ canvasContext: ctx, viewport: pg.getViewport({ scale: scale * k, rotation: R }) });
  cv._task = task;
  try { await task.promise; } catch {}
  if (cv._task === task) cv._task = null;
}
function paintPage(wrap) {
  const p = pageByKey(wrap.dataset.key); if (!p) return;
  const cv = wrap.querySelector('canvas');
  cv._done = true;
  paintCanvas(p, cv, S.scale);
}

function buildStage() {
  pageObserver.disconnect();
  pagesEl.textContent = '';
  S.pages.forEach((p, i) => {
    const { w, h } = dims(p);
    const wrap = el('div', 'page');
    wrap.dataset.key = p.key;
    wrap.style.width = w * S.scale + 'px';
    wrap.style.height = h * S.scale + 'px';
    const num = el('span', 'page-num'); num.textContent = 'Página ' + (i + 1);
    wrap.append(el('canvas'), el('div', 'layer'), num);
    pagesEl.append(wrap);
    pageObserver.observe(wrap);
    renderLayer(p);
  });
}

/* ---------------- capa de anotaciones ---------------- */
function annNode(a) {
  const sc = S.scale;
  let n;
  if (a.type === 'text') {
    n = el('div', 'ann a-text');
    const f = FONTS[a.font] || FONTS.helv;
    n.style.fontFamily = f.css;
    n.style.fontSize = a.size * sc + 'px';
    n.style.fontWeight = a.bold ? 700 : 400;
    n.style.color = a.color;
    n.textContent = a.text;
    if (S.editing === a.id) { n.contentEditable = 'plaintext-only'; n.classList.add('editing'); n.spellcheck = false; }
  } else if (a.type === 'rect' || a.type === 'hl') {
    n = el('div', 'ann ' + (a.type === 'rect' ? 'a-rect' : 'a-hl'));
    n.style.background = a.color;
  } else if (a.type === 'img') {
    n = el('div', 'ann a-img');
    const im = el('img'); im.src = S.images[a.img].src; im.draggable = false; n.append(im);
  } else if (a.type === 'ink') {
    n = el('div', 'ann a-ink');
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    const pl = document.createElementNS(ns, 'polyline');
    pl.setAttribute('points', a.pts.map(([x, y]) => ((x - a.x) * sc).toFixed(1) + ',' + ((y - a.y) * sc).toFixed(1)).join(' '));
    pl.setAttribute('stroke', a.color);
    pl.setAttribute('stroke-width', a.sw * sc);
    svg.append(pl); n.append(svg);
  }
  n.dataset.id = a.id;
  n.style.left = a.x * sc + 'px';
  n.style.top = a.y * sc + 'px';
  if (a.type !== 'text') { n.style.width = a.w * sc + 'px'; n.style.height = a.h * sc + 'px'; }
  if (S.sel && S.sel.id === a.id && S.editing !== a.id) {
    n.classList.add('sel');
    if (a.type === 'rect' || a.type === 'hl' || a.type === 'img') n.append(el('span', 'handle'));
  }
  return n;
}
function measure(a, n) {
  if (a.type === 'text') { a.w = n.offsetWidth / S.scale; a.h = n.offsetHeight / S.scale; }
}
function renderLayer(p) {
  const wrap = wrapOf(p.key); if (!wrap) return;
  const layer = wrap.querySelector('.layer');
  layer.textContent = '';
  for (const a of p.annots) { const n = annNode(a); layer.append(n); measure(a, n); }
  if (S.tool === 'edit') addHits(p, layer);
}
function refreshNode(p, a) {
  const wrap = wrapOf(p.key); if (!wrap) return;
  const old = wrap.querySelector(`.ann[data-id="${a.id}"]`);
  const n = annNode(a);
  if (old) old.replaceWith(n); else wrap.querySelector('.layer').append(n);
  measure(a, n);
}

/* ---------------- editar texto existente ---------------- */
async function getHits(p) {
  if (p.blank) return [];
  const d = S.docs[p.docId]; if (!d) return [];
  const pg = d.pages[p.index];
  const tc = d.tc[p.index] || (d.tc[p.index] = await pg.getTextContent());
  const vp = pg.getViewport({ scale: 1, rotation: dims(p).R });
  const used = new Set(p.annots.filter(a => a.hit != null).map(a => a.hit));
  const out = [];
  tc.items.forEach((it, i) => {
    if (!it.str || !it.str.trim() || used.has(i)) return;
    const t = pdfjsLib.Util.transform(vp.transform, it.transform);
    const fh = Math.hypot(t[2], t[3]);
    if (fh < 2 || t[0] <= 0 || Math.abs(t[1]) > 0.02 * t[0]) return;   // solo texto horizontal
    out.push({ i, x: t[4], y: t[5] - fh * 0.86, w: Math.max(it.width, 2), h: fh * 1.1, base: t[5], fh, str: it.str, fontName: it.fontName });
  });
  return out;
}
async function addHits(p, layer) {
  const hits = await getHits(p);
  if (S.tool !== 'edit' || !layer.isConnected) return;
  const sc = S.scale, frag = document.createDocumentFragment();
  hits.forEach(h => {
    const n = el('div', 'hit');
    n.style.cssText = `left:${h.x * sc}px;top:${h.y * sc}px;width:${h.w * sc}px;height:${h.h * sc}px`;
    n.title = 'Clic para editar';
    n._hit = h;
    frag.append(n);
  });
  layer.prepend(frag);
}
function fontInfo(p, fontName) {
  const d = S.docs[p.docId], pg = d.pages[p.index];
  let name = '', fam = '';
  try { if (pg.commonObjs.has(fontName)) { const f = pg.commonObjs.get(fontName); name = (f && (f.name || f.loadedName)) || ''; if (f && f.bold) name += ' bold'; } } catch {}
  try { fam = (d.tc[p.index].styles[fontName] || {}).fontFamily || ''; } catch {}
  const s = (name + ' ' + fam).toLowerCase();
  let font = 'helv';
  if (/courier|mono|consol/.test(s)) font = 'cour';
  else if (/times|georgia|garamond|roman|cambria|book|minion|serif/.test(s) && !/sans/.test(s)) font = 'times';
  return { font, bold: /bold|black|heavy|semibold|demi/.test(s) };
}
function canvasData(p, x, y, w, h) {
  const wrap = wrapOf(p.key); const cv = wrap && wrap.querySelector('canvas');
  if (!cv || !cv.width) return null;
  const k = cv.width / dims(p).w;
  const X = clamp(Math.round(x * k), 0, cv.width - 1), Y = clamp(Math.round(y * k), 0, cv.height - 1);
  const W = clamp(Math.round(w * k), 1, cv.width - X), H = clamp(Math.round(h * k), 1, cv.height - Y);
  try { return cv.getContext('2d').getImageData(X, Y, W, H).data; } catch { return null; }
}
function sampleBg(p, b) {
  // el color más claro de cuatro puntos alrededor del texto = fondo
  const pts = [[b.x - 3, b.y + b.h / 2], [b.x + b.w + 3, b.y + b.h / 2], [b.x + b.w / 2, b.y - 2], [b.x + b.w / 2, b.y + b.h + 2]];
  let best = null, bl = -1;
  for (const [x, y] of pts) {
    const d = canvasData(p, x, y, 1, 1); if (!d) continue;
    const l = d[0] * .3 + d[1] * .59 + d[2] * .11;
    if (l > bl) { bl = l; best = toHex(d[0], d[1], d[2]); }
  }
  return best || '#ffffff';
}
function sampleFg(p, b) {
  const d = canvasData(p, b.x, b.y, b.w, b.h); if (!d) return '#111111';
  let bl = 1e9, c = [17, 17, 17];
  for (let i = 0; i < d.length; i += 4) {
    const l = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11;
    if (l < bl) { bl = l; c = [d[i], d[i + 1], d[i + 2]]; }
  }
  return toHex(...c);
}
function editFromHit(p, h) {
  const before = snap();
  const info = fontInfo(p, h.fontName);
  const f = FONTS[info.font];
  const pad = h.fh * 0.08;
  const cover = { id: nid('a'), type: 'rect', hit: h.i, x: h.x - pad, y: h.y - pad, w: h.w + pad * 2, h: h.h + pad * 2, color: sampleBg(p, h) };
  const t = { id: nid('a'), type: 'text', x: h.x, y: h.base - h.fh * f.base, size: Math.round(h.fh * 10) / 10,
              font: info.font, bold: info.bold, color: sampleFg(p, h), text: h.str };
  p.annots.push(cover, t);
  startEditing(p, t, before, true);
}

/* ---------------- edición de cajas de texto ---------------- */
function startEditing(p, a, before, selectAll) {
  if (S.editing && S.editing !== a.id) finishEditing();
  S.editing = a.id;
  S.editCtx = { key: p.key, before: before || snap() };
  S.sel = { key: p.key, id: a.id };
  renderLayer(p); updateProps();
  const n = wrapOf(p.key).querySelector(`.ann[data-id="${a.id}"]`);
  n.focus();
  const r = document.createRange(); r.selectNodeContents(n);
  if (!selectAll) r.collapse(false);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  n.addEventListener('input', () => { a.text = n.innerText.replace(/\n$/, ''); measure(a, n); });
  n.addEventListener('blur', () => setTimeout(() => { if (S.editing === a.id && document.activeElement !== n) finishEditing(); }, 0));
  n.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); finishEditing(); }
  });
}
function finishEditing() {
  if (!S.editing) return;
  const id = S.editing, ctx = S.editCtx;
  S.editing = null; S.editCtx = null;
  const p = pageByKey(ctx.key); if (!p) return;
  const a = p.annots.find(x => x.id === id);
  if (a && !a.text.trim()) { p.annots.splice(p.annots.indexOf(a), 1); S.sel = null; }
  commit(ctx.before);
  renderLayer(p); updateProps();
}

/* ---------------- ratón ---------------- */
let drag = null;
function localPt(e, layer) {
  const r = layer.getBoundingClientRect();
  return { x: (e.clientX - r.left) / S.scale, y: (e.clientY - r.top) / S.scale };
}
function setSel(key, id) { S.sel = id ? { key, id } : null; }

stage.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const layer = e.target.closest('.layer');
  const annEl = e.target.closest('.ann');
  if (annEl && annEl.classList.contains('editing')) return;     // mover el cursor dentro del texto
  const hitEl = e.target.closest('.hit');
  if (S.editing) finishEditing();
  if (!layer) { if (S.sel) { const old = S.sel; S.sel = null; const p = pageByKey(old.key); if (p) renderLayer(p); updateProps(); } return; }
  const p = pageByKey(layer.parentElement.dataset.key);
  const pt = localPt(e, layer);
  const a = annEl && p.annots.find(x => x.id === annEl.dataset.id);
  const tool = S.tool;
  const prevSel = S.sel;

  if ((tool === 'text' || tool === 'edit') && a && a.type === 'text') { e.preventDefault(); startEditing(p, a); return; }
  if (tool === 'edit' && hitEl && hitEl._hit) { e.preventDefault(); editFromHit(p, hitEl._hit); return; }

  if (tool === 'select') {
    e.preventDefault();
    setSel(p.key, a ? a.id : null);
    if (prevSel && prevSel.key !== p.key) { const pp = pageByKey(prevSel.key); if (pp) renderLayer(pp); }
    renderLayer(p); updateProps();
    if (!a) return;
    drag = { mode: e.target.classList.contains('handle') ? 'resize' : 'move', p, a, layer, start: pt,
             orig: JSON.parse(JSON.stringify(a)), before: snap(), moved: false };
  } else if (tool === 'text') {
    e.preventDefault();
    const d = S.defaults.text;
    const t = { id: nid('a'), type: 'text', x: pt.x, y: pt.y - d.size * 0.6, size: d.size, font: d.font, bold: d.bold, color: d.color, text: '' };
    const before = snap();
    p.annots.push(t);
    setTool('select');
    startEditing(p, t, before, true);
  } else if (tool === 'rect' || tool === 'hl') {
    e.preventDefault();
    const n = { id: nid('a'), type: tool, x: pt.x, y: pt.y, w: 0, h: 0, color: S.defaults[tool].color };
    drag = { mode: 'draw', p, a: n, layer, start: pt, before: snap() };
    p.annots.push(n); setSel(p.key, null); refreshNode(p, n);
  } else if (tool === 'ink') {
    e.preventDefault();
    const d = S.defaults.ink;
    const n = { id: nid('a'), type: 'ink', pts: [[pt.x, pt.y]], color: d.color, sw: d.sw, x: pt.x, y: pt.y, w: 0, h: 0 };
    drag = { mode: 'ink', p, a: n, layer, before: snap() };
    p.annots.push(n); refreshNode(p, n);
  }
});
function inkBox(a) {
  const xs = a.pts.map(q => q[0]), ys = a.pts.map(q => q[1]), pad = a.sw / 2;
  a.x = Math.min(...xs) - pad; a.y = Math.min(...ys) - pad;
  a.w = Math.max(...xs) - Math.min(...xs) + pad * 2; a.h = Math.max(...ys) - Math.min(...ys) + pad * 2;
}
window.addEventListener('pointermove', e => {
  if (!drag) return;
  const pt = localPt(e, drag.layer);
  const { a, orig } = drag;
  if (drag.mode === 'move') {
    const dx = pt.x - drag.start.x, dy = pt.y - drag.start.y;
    if (!drag.moved && Math.hypot(dx, dy) * S.scale < 3) return;
    a.x = orig.x + dx; a.y = orig.y + dy;
    if (a.type === 'ink') a.pts = orig.pts.map(([x, y]) => [x + dx, y + dy]);
  } else if (drag.mode === 'resize') {
    a.w = Math.max(4, orig.w + pt.x - drag.start.x);
    a.h = a.type === 'img' ? a.w * orig.h / orig.w : Math.max(3, orig.h + pt.y - drag.start.y);
  } else if (drag.mode === 'draw') {
    a.x = Math.min(drag.start.x, pt.x); a.y = Math.min(drag.start.y, pt.y);
    a.w = Math.abs(pt.x - drag.start.x); a.h = Math.abs(pt.y - drag.start.y);
  } else if (drag.mode === 'ink') {
    const last = a.pts[a.pts.length - 1];
    if (Math.hypot(pt.x - last[0], pt.y - last[1]) * S.scale < 1.5) return;
    a.pts.push([pt.x, pt.y]); inkBox(a);
  }
  drag.moved = true;
  refreshNode(drag.p, a);
});
window.addEventListener('pointerup', () => {
  if (!drag) return;
  const { p, a, mode } = drag;
  if (mode === 'draw' && (a.w < 3 || a.h < 3)) { p.annots.splice(p.annots.indexOf(a), 1); renderLayer(p); }
  else {
    if (mode === 'ink') { if (a.pts.length === 1) a.pts.push([a.pts[0][0] + 0.1, a.pts[0][1]]); inkBox(a); }
    commit(drag.before);
    if (mode === 'draw' || mode === 'ink') renderLayer(p);
  }
  drag = null;
});
stage.addEventListener('dblclick', e => {
  const annEl = e.target.closest('.ann'); const layer = e.target.closest('.layer');
  if (!annEl || !layer || S.tool !== 'select') return;
  const p = pageByKey(layer.parentElement.dataset.key);
  const a = p.annots.find(x => x.id === annEl.dataset.id);
  if (a && a.type === 'text') startEditing(p, a);
});

/* ---------------- herramientas y propiedades ---------------- */
function setTool(t) {
  finishEditing();
  S.tool = t;
  stage.dataset.tool = t;
  $$('.tool[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === t));
  if (t !== 'select' && S.sel) { const p = pageByKey(S.sel.key); S.sel = null; if (p) renderLayer(p); }
  S.pages.forEach(renderLayer);
  updateProps();
  if (t === 'edit' && S.pages.length) toast('Pasa el mouse sobre el texto y haz <b>clic</b> en lo que quieras cambiar');
}
function propTarget() {
  const s = selAnnot();
  if (s) return { type: s.a.type, obj: s.a, s };
  const type = TOOL_TYPE[S.tool];
  return type ? { type, obj: S.defaults[type] } : null;
}
function updateProps() {
  const t = propTarget();
  const show = { text: false, ink: false, color: false, del: false };
  if (t) {
    show.text = t.type === 'text';
    show.ink = t.type === 'ink';
    show.color = t.type !== 'img';
    show.del = !!t.s;
    const o = t.obj;
    if (show.text) { $('#pFont').value = o.font; $('#pSize').value = o.size; $('#pBold').classList.toggle('on', !!o.bold); }
    if (show.ink) $('#pWidth').value = o.sw;
    if (show.color) { $('#pColor').value = o.color; $('#pSwatch').style.background = o.color; }
  }
  $$('#props .pg').forEach(g => g.classList.toggle('on', !!show[g.dataset.for]));
}
function applyProp(fn) {
  finishEditing();
  const t = propTarget(); if (!t) return;
  if (t.s) {
    const before = snap();
    fn(t.s.a); fn(S.defaults[t.type] || {});
    commit(before);
    refreshNode(t.s.p, t.s.a);
  } else fn(t.obj);
  updateProps();
}
$('#pFont').addEventListener('change', e => applyProp(o => { o.font = e.target.value; }));
$('#pSize').addEventListener('change', e => { const v = clamp(+e.target.value || 12, 4, 200); applyProp(o => { o.size = v; }); });
$('#pBold').addEventListener('mousedown', e => e.preventDefault());
$('#pBold').addEventListener('click', () => applyProp(o => { o.bold = !o.bold; }));
$('#pWidth').addEventListener('change', e => applyProp(o => { o.sw = +e.target.value; }));
$('#pColor').addEventListener('input', e => { $('#pSwatch').style.background = e.target.value; });
$('#pColor').addEventListener('change', e => applyProp(o => { o.color = e.target.value; }));
$('#pPick').addEventListener('click', async () => {
  if (!window.EyeDropper) { toast('Tu navegador no tiene gotero; usa Chrome o Edge'); return; }
  try { const r = await new EyeDropper().open(); applyProp(o => { o.color = r.sRGBHex; }); } catch {}
});
$('#pDel').addEventListener('click', deleteSel);
function deleteSel() {
  const s = selAnnot(); if (!s) return;
  const before = snap();
  s.p.annots.splice(s.p.annots.indexOf(s.a), 1);
  S.sel = null; commit(before); renderLayer(s.p); updateProps();
}

$$('.tool[data-tool]').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
$$('.tool[data-act]').forEach(b => b.addEventListener('click', () => {
  if (!S.pages.length) { toast('Primero abre un PDF'); return; }
  if (b.dataset.act === 'image') $('#fImg').click(); else openSign();
}));

/* ---------------- imágenes y firma ---------------- */
function currentPage() {
  const r = stage.getBoundingClientRect(), mid = r.top + r.height / 2;
  let best = null, bd = Infinity;
  for (const w of pagesEl.children) {
    const b = w.getBoundingClientRect();
    const d = mid < b.top ? b.top - mid : mid > b.bottom ? mid - b.bottom : 0;
    if (d < bd) { bd = d; best = w; }
  }
  return best ? { p: pageByKey(best.dataset.key), wrap: best } : null;
}
function loadImg(src) { return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; }); }
function placeImage(src, kind, maxW) {
  return loadImg(src).then(img => {
    const cur = currentPage(); if (!cur) return;
    const { p, wrap } = cur, { w, h } = dims(p);
    let W = Math.min(maxW, w * 0.7), H = W * img.naturalHeight / img.naturalWidth;
    if (H > h * 0.7) { H = h * 0.7; W = H * img.naturalWidth / img.naturalHeight; }
    const r = stage.getBoundingClientRect(), b = wrap.getBoundingClientRect();
    const cy = ((r.top + r.height / 2) - b.top) / S.scale;
    const id = nid('i'); S.images[id] = { src, kind };
    const a = { id: nid('a'), type: 'img', img: id, x: (w - W) / 2, y: clamp(cy - H / 2, 0, Math.max(0, h - H)), w: W, h: H };
    const before = snap();
    p.annots.push(a);
    setTool('select'); S.sel = { key: p.key, id: a.id };
    commit(before); renderLayer(p); updateProps();
    toast('Arrástrala a su lugar; el punto <b>lima</b> cambia el tamaño');
  });
}
$('#fImg').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  let src = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); });
  let kind = /image\/jpe?g/.test(f.type) ? 'jpg' : 'png';
  if (!/image\/(png|jpe?g)/.test(f.type)) {           // webp, gif, etc. -> png
    const img = await loadImg(src); const c = el('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0);
    src = c.toDataURL('image/png'); kind = 'png';
  }
  placeImage(src, kind, 240);
});

const pad = $('#signPad'), pctx = pad.getContext('2d');
let inkColor = '#111111', signing = null, signed = false;
function openSign() {
  pctx.clearRect(0, 0, pad.width, pad.height); signed = false;
  $('#sSaved').hidden = !localStorage.getItem('vonoa-firma');
  $('#signModal').hidden = false;
}
const closeSign = () => { $('#signModal').hidden = true; };
function padPt(e) { const r = pad.getBoundingClientRect(); return [(e.clientX - r.left) * pad.width / r.width, (e.clientY - r.top) * pad.height / r.height]; }
pad.addEventListener('pointerdown', e => { pad.setPointerCapture(e.pointerId); signing = padPt(e); signed = true; });
pad.addEventListener('pointermove', e => {
  if (!signing) return;
  const q = padPt(e);
  pctx.strokeStyle = inkColor; pctx.lineWidth = 5; pctx.lineCap = pctx.lineJoin = 'round';
  pctx.beginPath(); pctx.moveTo(...signing); pctx.lineTo(...q); pctx.stroke();
  signing = q;
});
pad.addEventListener('pointerup', () => { signing = null; });
$$('.swatch-btn').forEach(b => b.addEventListener('click', () => {
  inkColor = b.dataset.ink; $$('.swatch-btn').forEach(x => x.classList.toggle('active', x === b));
}));
$('#sClear').addEventListener('click', () => { pctx.clearRect(0, 0, pad.width, pad.height); signed = false; });
$('#sCancel').addEventListener('click', closeSign);
$('#signModal').addEventListener('pointerdown', e => { if (e.target.id === 'signModal') closeSign(); });
$('#sSaved').addEventListener('click', () => { closeSign(); placeImage(localStorage.getItem('vonoa-firma'), 'png', 170); });
$('#sOk').addEventListener('click', () => {
  if (!signed) { toast('Dibuja tu firma primero'); return; }
  const d = pctx.getImageData(0, 0, pad.width, pad.height).data;
  let x0 = pad.width, y0 = pad.height, x1 = 0, y1 = 0;
  for (let y = 0; y < pad.height; y++) for (let x = 0; x < pad.width; x++) {
    if (d[(y * pad.width + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 <= x0) { toast('Dibuja tu firma primero'); return; }
  const m = 6, c = el('canvas');
  c.width = x1 - x0 + m * 2; c.height = y1 - y0 + m * 2;
  c.getContext('2d').drawImage(pad, x0 - m, y0 - m, c.width, c.height, 0, 0, c.width, c.height);
  const src = c.toDataURL('image/png');
  try { localStorage.setItem('vonoa-firma', src); } catch {}
  closeSign(); placeImage(src, 'png', 170);
});

/* ---------------- páginas: panel estilo Vista Previa ---------------- */
const thumbScale = p => { const { w, h } = dims(p); return 150 / w * (w > h ? 1 : 0.8); };
const thumbObserver = new IntersectionObserver(entries => {
  for (const en of entries) if (en.isIntersecting) {
    const t = en.target, p = pageByKey(t.dataset.key), cv = t.querySelector('canvas');
    if (p && !cv._done) { cv._done = true; paintCanvas(p, cv, thumbScale(p)); }
  }
}, { root: thumbsEl, rootMargin: '400px 0px' });

const ICON_ROT = '<svg viewBox="0 0 24 24"><path d="M19.5 12a7.5 7.5 0 11-2.2-5.3M19.5 4.5v4h-4"/></svg>';
const ICON_DEL = '<svg viewBox="0 0 24 24"><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/></svg>';
S.pick = new Set();          // páginas seleccionadas en el panel
let anchorKey = null;        // punto de partida para Shift+clic
let panelFocus = false;      // el teclado actúa sobre las páginas
let dragKeys = null;         // páginas que se están arrastrando

function buildThumbs() {
  thumbObserver.disconnect();
  thumbsEl.textContent = '';
  S.pick = new Set([...S.pick].filter(k => pageByKey(k)));
  S.pages.forEach((p, i) => {
    const t = el('div', 'thumb'); t.dataset.key = p.key; t.draggable = true;
    const tc = el('div', 'tc'), cv = el('canvas'), num = el('span', 'tn'), act = el('div', 'ta');
    const { w, h } = dims(p), sc = thumbScale(p);
    tc.style.width = w * sc + 'px'; tc.style.height = h * sc + 'px';
    num.textContent = i + 1;
    act.innerHTML = `<button data-a="rot" title="Girar a la derecha">${ICON_ROT}</button><button data-a="del" title="Eliminar">${ICON_DEL}</button>`;
    tc.append(cv, act); t.append(tc, num); thumbsEl.append(t);
    thumbObserver.observe(t);
  });
  $('#pageCount').textContent = S.pages.length;
  paintPicks(); markCurrent();
}
const pickedPages = () => S.pages.filter(p => S.pick.has(p.key));
const thumbOf = k => thumbsEl.querySelector(`.thumb[data-key="${k}"]`);
function paintPicks() {
  $$('.thumb', thumbsEl).forEach(t => t.classList.toggle('picked', S.pick.has(t.dataset.key)));
  const n = S.pick.size;
  $('#pickInfo').innerHTML = n > 1 ? `<b>${n}</b> seleccionadas · <kbd>Supr</kbd> elimina` : 'Clic derecho para más opciones';
}
function pickClick(key, e) {
  const keys = S.pages.map(p => p.key);
  const multi = e.ctrlKey || e.metaKey;
  if (e.shiftKey && anchorKey && keys.includes(anchorKey)) {
    const a = keys.indexOf(anchorKey), b = keys.indexOf(key);
    if (!multi) S.pick.clear();
    keys.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(k => S.pick.add(k));
  } else if (multi) {
    S.pick.has(key) ? S.pick.delete(key) : S.pick.add(key); anchorKey = key;
  } else { S.pick = new Set([key]); anchorKey = key; }
  paintPicks();
}
// si la página clicada es parte de la selección, la acción va para todas las seleccionadas
const targetsOf = p => (S.pick.has(p.key) && S.pick.size > 1) ? pickedPages() : [p];

thumbsEl.addEventListener('click', e => {
  const t = e.target.closest('.thumb'); if (!t) return;
  panelFocus = true;
  const act = e.target.closest('[data-a]');
  const p = pageByKey(t.dataset.key);
  if (act) { e.stopPropagation(); return act.dataset.a === 'rot' ? rotatePages(targetsOf(p), 1) : deletePages(targetsOf(p)); }
  pickClick(p.key, e);
  if (!e.shiftKey && !e.ctrlKey && !e.metaKey) wrapOf(p.key).scrollIntoView({ behavior: 'smooth', block: 'start' });
});
stage.addEventListener('pointerdown', () => { panelFocus = false; hideMenu(); }, true);

/* --- arrastrar páginas (una o varias) y soltar PDFs en un lugar exacto --- */
function dropSlot(e) {
  $$('.thumb', thumbsEl).forEach(x => x.classList.remove('drop-before', 'drop-after'));
  const all = $$('.thumb', thumbsEl); if (!all.length) return;
  let t = e.target.closest('.thumb'), after;
  if (!t) { t = all[all.length - 1]; after = true; }
  else { const b = t.getBoundingClientRect(); after = e.clientY > b.top + b.height / 2; }
  if (dragKeys && dragKeys.includes(t.dataset.key)) return;
  t.classList.add(after ? 'drop-after' : 'drop-before');
}
const isFileDrag = e => [...e.dataTransfer.types].includes('Files');
thumbsEl.addEventListener('dragstart', e => {
  const t = e.target.closest('.thumb'); if (!t) return;
  if (!S.pick.has(t.dataset.key)) { S.pick = new Set([t.dataset.key]); anchorKey = t.dataset.key; paintPicks(); }
  dragKeys = pickedPages().map(p => p.key);
  dragKeys.forEach(k => thumbOf(k).classList.add('dragging'));
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragKeys.length + ' páginas');
});
thumbsEl.addEventListener('dragover', e => {
  if (!dragKeys && !isFileDrag(e)) return;
  e.preventDefault(); e.stopPropagation();
  if (isFileDrag(e)) e.dataTransfer.dropEffect = 'copy';
  dropSlot(e);
});
thumbsEl.addEventListener('drop', e => {
  e.preventDefault(); e.stopPropagation();
  dragDepth = 0; document.body.classList.remove('dragging');
  const slot = $('.thumb.drop-before, .thumb.drop-after', thumbsEl);
  const after = !!slot && slot.classList.contains('drop-after');
  $$('.thumb', thumbsEl).forEach(x => x.classList.remove('drop-before', 'drop-after'));
  if (dragKeys) {
    if (slot) {
      const before = snap();
      const moving = S.pages.filter(p => dragKeys.includes(p.key));
      const rest = S.pages.filter(p => !dragKeys.includes(p.key));
      rest.splice(rest.findIndex(p => p.key === slot.dataset.key) + (after ? 1 : 0), 0, ...moving);
      S.pages = rest;
      commit(before); rebuild();
    }
    dragKeys = null;
    return;
  }
  const pdfs = [...e.dataTransfer.files].filter(f => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
  if (!pdfs.length) { toast('Aquí solo se pueden soltar archivos PDF'); return; }
  const at = slot ? S.pages.findIndex(p => p.key === slot.dataset.key) + (after ? 1 : 0) : S.pages.length;
  appendFiles(pdfs, at);
});
thumbsEl.addEventListener('dragleave', e => {
  if (!thumbsEl.contains(e.relatedTarget)) $$('.thumb', thumbsEl).forEach(x => x.classList.remove('drop-before', 'drop-after'));
});
thumbsEl.addEventListener('dragend', () => {
  dragKeys = null; $$('.thumb', thumbsEl).forEach(x => x.classList.remove('drop-before', 'drop-after', 'dragging'));
});

/* --- acciones sobre páginas --- */
function rotateCW(p) {
  const { h } = dims(p);   // alto antes de girar 90° a la derecha: (x, y) -> (h - y, x)
  for (const a of p.annots) {
    if (a.type === 'ink') { a.pts = a.pts.map(([x, y]) => [h - y, x]); inkBox(a); }
    else if (a.type === 'rect' || a.type === 'hl') { const nx = h - (a.y + a.h); [a.x, a.y, a.w, a.h] = [nx, a.x, a.h, a.w]; }
    else { const aw = a.w || 0, ah = a.h || 0, cx = a.x + aw / 2, cy = a.y + ah / 2; a.x = h - cy - aw / 2; a.y = cx - ah / 2; }
  }
  p.rot = norm(p.rot + 90);
}
function rotatePages(list, times) {   // times: 1 = derecha, 3 = izquierda
  if (!list.length) return;
  finishEditing();
  const before = snap();
  list.forEach(p => { for (let i = 0; i < times; i++) rotateCW(p); });
  commit(before); rebuild();
}
function deletePages(list) {
  if (!list.length) return;
  if (list.length >= S.pages.length) { toast('No puedes eliminar todas las páginas'); return; }
  finishEditing();
  const before = snap();
  const gone = new Set(list.map(p => p.key));
  const last = S.pages.indexOf(list[list.length - 1]);
  const next = S.pages.slice(last + 1).find(p => !gone.has(p.key)) || [...S.pages].reverse().find(p => !gone.has(p.key));
  S.pages = S.pages.filter(p => !gone.has(p.key));
  if (S.sel && gone.has(S.sel.key)) S.sel = null;
  S.pick = new Set(next ? [next.key] : []); anchorKey = next ? next.key : null;
  commit(before); rebuild(); updateProps();
  toast((list.length === 1 ? 'Página eliminada' : `<b>${list.length}</b> páginas eliminadas`) + ' · <b>Ctrl+Z</b> para recuperar');
}
function duplicatePages(list) {
  if (!list.length) return;
  const before = snap();
  const copies = list.map(p => {
    const c = JSON.parse(JSON.stringify(p));
    c.key = nid('p'); c.annots.forEach(a => { a.id = nid('a'); });
    return c;
  });
  S.pages.splice(S.pages.indexOf(list[list.length - 1]) + 1, 0, ...copies);
  S.pick = new Set(copies.map(p => p.key)); anchorKey = copies[0].key;
  commit(before); rebuild();
}
function insertBlank(ref) {
  ref = ref || (currentPage() || {}).p || S.pages[S.pages.length - 1];
  const { w, h } = ref ? dims(ref) : { w: 612, h: 792 };
  const before = snap();
  const np = { key: nid('p'), blank: true, bw: w, bh: h, orig: 0, rot: 0, annots: [] };
  S.pages.splice(ref ? S.pages.indexOf(ref) + 1 : S.pages.length, 0, np);
  S.pick = new Set([np.key]); anchorKey = np.key;
  commit(before); rebuild();
  wrapOf(np.key).scrollIntoView({ behavior: 'smooth', block: 'start' });
}
let insertAt = null;
$('#bBlank').addEventListener('click', () => insertBlank(pickedPages().pop()));
$('#bAddPdf').addEventListener('click', () => { insertAt = null; $('#fAdd').click(); });
$('#fAdd').addEventListener('change', e => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) appendFiles(fs, insertAt); insertAt = null; });

/* --- menú de clic derecho --- */
const menu = el('div', 'ctx'); menu.hidden = true; document.body.append(menu);
function hideMenu() { menu.hidden = true; }
thumbsEl.addEventListener('contextmenu', e => {
  const t = e.target.closest('.thumb'); if (!t) return;
  e.preventDefault(); panelFocus = true;
  if (!S.pick.has(t.dataset.key)) { S.pick = new Set([t.dataset.key]); anchorKey = t.dataset.key; paintPicks(); }
  const n = S.pick.size, s = n > 1 ? ` <em>${n}</em>` : '';
  menu.innerHTML = `
    <button data-m="rotL">Girar a la izquierda${s}<kbd>Ctrl+L</kbd></button>
    <button data-m="rotR">Girar a la derecha${s}<kbd>Ctrl+R</kbd></button>
    <hr>
    <button data-m="dup">Duplicar${s}<kbd>Ctrl+D</kbd></button>
    <button data-m="blank">Insertar página en blanco</button>
    <button data-m="file">Insertar páginas de otro PDF…</button>
    <hr>
    <button data-m="extract">Guardar ${n > 1 ? 'estas ' + n + ' páginas' : 'esta página'} como PDF…</button>
    <hr>
    <button data-m="del" class="danger">Eliminar${s}<kbd>Supr</kbd></button>`;
  menu.hidden = false;
  const r = menu.getBoundingClientRect();
  menu.style.left = Math.min(e.clientX, innerWidth - r.width - 8) + 'px';
  menu.style.top = Math.min(e.clientY, innerHeight - r.height - 8) + 'px';
});
menu.addEventListener('click', e => {
  const b = e.target.closest('[data-m]'); if (!b) return;
  hideMenu();
  const list = pickedPages();
  const acts = {
    rotL: () => rotatePages(list, 3),
    rotR: () => rotatePages(list, 1),
    dup: () => duplicatePages(list),
    blank: () => insertBlank(list[list.length - 1]),
    file: () => { insertAt = S.pages.indexOf(list[list.length - 1]) + 1; $('#fAdd').click(); },
    extract: () => save(list, list.length === 1 ? '-pagina-' + (S.pages.indexOf(list[0]) + 1) : '-paginas'),
    del: () => deletePages(list),
  };
  acts[b.dataset.m]();
});
window.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target)) hideMenu(); });
thumbsEl.addEventListener('scroll', hideMenu);
window.addEventListener('blur', hideMenu);

// teclado del panel de páginas; devuelve true si atendió la tecla
function pagesKey(e) {
  if (!panelFocus || !S.pages.length) return false;
  const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (k === 'escape' && !menu.hidden) { hideMenu(); return true; }
  if (mod && k === 'a') { S.pick = new Set(S.pages.map(p => p.key)); paintPicks(); return true; }
  if (!S.pick.size) return false;
  const list = pickedPages();
  if (k === 'delete' || k === 'backspace') { deletePages(list); return true; }
  if (mod && k === 'r') { rotatePages(list, 1); return true; }
  if (mod && k === 'l') { rotatePages(list, 3); return true; }
  if (mod && k === 'd') { duplicatePages(list); return true; }
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
    const keys = S.pages.map(p => p.key);
    const from = keys.indexOf(anchorKey && S.pick.has(anchorKey) ? anchorKey : list[list.length - 1].key);
    const nk = keys[clamp(from + (k === 'arrowup' || k === 'arrowleft' ? -1 : 1), 0, keys.length - 1)];
    if (e.shiftKey) { S.pick.add(nk); paintPicks(); } else pickClick(nk, {});
    anchorKey = nk;
    thumbOf(nk).scrollIntoView({ block: 'nearest' });
    wrapOf(nk).scrollIntoView({ block: 'start' });
    return true;
  }
  return false;
}

function rebuild() { buildStage(); buildThumbs(); }
function markCurrent() {
  const cur = currentPage(); if (!cur) return;
  $$('.thumb', thumbsEl).forEach(t => t.classList.toggle('cur', t.dataset.key === cur.p.key));
}
let scrollRaf;
stage.addEventListener('scroll', () => { cancelAnimationFrame(scrollRaf); scrollRaf = requestAnimationFrame(markCurrent); });

/* ---------------- zoom ---------------- */
function setZoom(z) {
  z = clamp(Math.round(z * 100) / 100, 0.3, 4);
  if (z === S.scale) return;
  finishEditing();
  const ratio = stage.scrollTop / Math.max(1, stage.scrollHeight);
  S.scale = z; $('#bZoom').textContent = Math.round(z * 100) + '%';
  buildStage();
  stage.scrollTop = ratio * stage.scrollHeight;
}
function fitWidth(silent) {
  const maxW = Math.max(...S.pages.map(p => dims(p).w), 1);
  const z = clamp((stage.clientWidth - 110) / maxW, 0.3, 1.6);
  if (silent) { S.scale = Math.round(z * 100) / 100; $('#bZoom').textContent = Math.round(S.scale * 100) + '%'; }
  else setZoom(z);
}
$('#bZoomIn').addEventListener('click', () => setZoom(S.scale * 1.2));
$('#bZoomOut').addEventListener('click', () => setZoom(S.scale / 1.2));
$('#bZoom').addEventListener('click', () => fitWidth(false));
stage.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); setZoom(S.scale * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); }, { passive: false });

/* ---------------- guardar ---------------- */
// De "pantalla a escala 1" (página ya girada R grados) al espacio del PDF.
function mapper(R, box) {
  const { x: bx, y: by, width: W, height: H } = box;
  switch (R) {
    case 90:  return (x, y) => ({ x: bx + y,     y: by + x });
    case 180: return (x, y) => ({ x: bx + W - x, y: by + y });
    case 270: return (x, y) => ({ x: bx + W - y, y: by + H - x });
    default:  return (x, y) => ({ x: bx + x,     y: by + H - y });
  }
}
function boxToPdf(M, a) {
  const c = [M(a.x, a.y), M(a.x + a.w, a.y + a.h)];
  const x = Math.min(c[0].x, c[1].x), y = Math.min(c[0].y, c[1].y);
  return { x, y, width: Math.abs(c[0].x - c[1].x), height: Math.abs(c[0].y - c[1].y) };
}
function cleanText(s, font) {
  let out = '';
  for (const ch of s) { try { font.encodeText(ch); out += ch; } catch { out += ch === '\t' ? '    ' : ''; } }
  return out;
}

async function buildPdf(list = S.pages) {
  const out = await PDFDocument.create();
  const libs = {}, copied = {};
  // copiar todas las páginas de cada documento de una sola vez (recursos compartidos una vez)
  for (const p of list) if (!p.blank) (copied[p.docId] = copied[p.docId] || new Set()).add(p.index);
  for (const id in copied) {
    libs[id] = await PDFDocument.load(S.docs[id].bytes, { ignoreEncryption: true, updateMetadata: false });
    const idx = [...copied[id]];
    const pages = await out.copyPages(libs[id], idx);
    copied[id] = Object.fromEntries(idx.map((ix, k) => [ix, pages[k]]));
  }
  const fonts = {}, imgs = {};
  const font = async (f, bold) => {
    const k = f + (bold ? 'B' : '');
    return fonts[k] || (fonts[k] = await out.embedFont(FONTS[f].std[bold ? 1 : 0]));
  };
  const image = async id => {
    if (imgs[id]) return imgs[id];
    const im = S.images[id], bytes = await (await fetch(im.src)).arrayBuffer();
    return (imgs[id] = im.kind === 'jpg' ? await out.embedJpg(bytes) : await out.embedPng(bytes));
  };

  const used = new Set();
  for (const p of list) {
    let page, box;
    if (p.blank) {
      page = out.addPage([p.bw, p.bh]);
      box = { x: 0, y: 0, width: p.bw, height: p.bh };
    } else {
      page = copied[p.docId][p.index];
      if (used.has(page)) [page] = await out.copyPages(libs[p.docId], [p.index]);   // página duplicada
      used.add(page);
      out.addPage(page);
      box = page.getCropBox();
    }
    const R = norm((p.blank ? 0 : page.getRotation().angle) + p.rot);
    page.setRotation(degrees(R));
    const M = mapper(R, box);

    for (const a of p.annots) {
      if (a.type === 'rect') page.drawRectangle({ ...boxToPdf(M, a), color: hexToRgb(a.color) });
      else if (a.type === 'hl') page.drawRectangle({ ...boxToPdf(M, a), color: hexToRgb(a.color), opacity: 0.45, blendMode: BlendMode.Multiply });
      else if (a.type === 'img') {
        const q = M(a.x, a.y + a.h);
        page.drawImage(await image(a.img), { x: q.x, y: q.y, width: a.w, height: a.h, rotate: degrees(R) });
      } else if (a.type === 'text') {
        const f = await font(a.font, a.bold), base = FONTS[a.font].base;
        a.text.split('\n').forEach((line, i) => {
          const txt = cleanText(line, f); if (!txt) return;
          const q = M(a.x, a.y + a.size * (base + 1.2 * i));
          page.drawText(txt, { x: q.x, y: q.y, size: a.size, font: f, color: hexToRgb(a.color), rotate: degrees(R) });
        });
      } else if (a.type === 'ink') {
        const c = hexToRgb(a.color);
        for (let i = 1; i < a.pts.length; i++) {
          page.drawLine({ start: M(...a.pts[i - 1]), end: M(...a.pts[i]), thickness: a.sw, color: c, lineCap: LineCapStyle.Round });
        }
      }
    }
  }
  return out.save();
}

async function save(list, suffix) {
  if (!Array.isArray(list)) list = null;
  if (!S.pages.length) return;
  finishEditing();
  const btn = $('#bSave'); btn.disabled = true;
  const label = btn.lastChild.textContent; btn.lastChild.textContent = ' Guardando…';
  try {
    const bytes = await buildPdf(list || S.pages);
    track(list ? 'pdf_extraer' : 'pdf_guardar', { paginas: (list || S.pages).length });
    const name = S.name + (list ? suffix : '-editado') + '.pdf';
    const blob = new Blob([bytes], { type: 'application/pdf' });
    if (window.showSaveFilePicker) {
      try {
        const h = await showSaveFilePicker({ suggestedName: name, types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }] });
        const w = await h.createWritable(); await w.write(blob); await w.close();
        if (!list) S.dirty = false; toast('Guardado como <b>' + esc(h.name) + '</b>');
        return;
      } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = el('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    if (!list) S.dirty = false; toast('Descargado: <b>' + esc(name) + '</b>');
  } catch (e) {
    console.error(e);
    toast('No se pudo guardar: ' + esc(e.message || e), 5000);
  } finally {
    btn.disabled = false; btn.lastChild.textContent = label;
  }
}
$('#bSave').addEventListener('click', save);

/* ---------------- archivos y teclado ---------------- */
$('#bOpen').addEventListener('click', () => $('#fOpen').click());
$('#bOpen2').addEventListener('click', () => $('#fOpen').click());
$('#fOpen').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; openFile(f); });
$('#bUndo').addEventListener('click', undo);
$('#bRedo').addEventListener('click', redo);

let dragDepth = 0;
window.addEventListener('dragenter', e => { if (e.dataTransfer.types.includes('Files')) { dragDepth++; document.body.classList.add('dragging'); } });
window.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; document.body.classList.remove('dragging'); } });
window.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); });
window.addEventListener('drop', e => {
  if (!e.dataTransfer.files.length) return;
  e.preventDefault(); dragDepth = 0; document.body.classList.remove('dragging');
  const pdfs = [...e.dataTransfer.files].filter(f => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
  const imgs = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
  if (pdfs.length) { if (S.pages.length) appendFiles(pdfs); else openFile(pdfs[0]).then(() => pdfs.length > 1 && appendFiles(pdfs.slice(1))); }
  else if (imgs.length && S.pages.length) { const dt = new DataTransfer(); dt.items.add(imgs[0]); $('#fImg').files = dt.files; $('#fImg').dispatchEvent(new Event('change')); }
});

const KEYS = { v: 'select', e: 'edit', t: 'text', b: 'rect', h: 'hl', d: 'ink' };
window.addEventListener('keydown', e => {
  if (e.target.closest('input, select, textarea, [contenteditable]')) return;
  if (pagesKey(e)) { e.preventDefault(); return; }
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); save(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'o') { e.preventDefault(); $('#fOpen').click(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!$('#signModal').hidden) { if (k === 'escape') closeSign(); return; }
  if (k === 'delete' || k === 'backspace') { e.preventDefault(); deleteSel(); return; }
  if (k === 'escape') { setTool('select'); return; }
  if (KEYS[k] && S.pages.length) { setTool(KEYS[k]); return; }
  if (k === 'i' && S.pages.length) $('#fImg').click();
  if (k === 'f' && S.pages.length) openSign();
  const s = selAnnot();
  if (s && k.startsWith('arrow')) {
    e.preventDefault();
    const st = e.shiftKey ? 10 : 1, before = snap();
    const dx = k === 'arrowleft' ? -st : k === 'arrowright' ? st : 0, dy = k === 'arrowup' ? -st : k === 'arrowdown' ? st : 0;
    s.a.x += dx; s.a.y += dy;
    if (s.a.pts) s.a.pts = s.a.pts.map(([x, y]) => [x + dx, y + dy]);
    commit(before); refreshNode(s.p, s.a);
  }
});
window.addEventListener('beforeunload', e => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

updateProps();
