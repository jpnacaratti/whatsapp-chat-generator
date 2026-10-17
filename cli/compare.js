#!/usr/bin/env node
'use strict';
// Compara o PNG do CLI (screenshot do Chromium) com o PNG da interface web (html-to-image) para o mesmo JSON.
// Uso: node cli/compare.js <conversa.json> [--scale 3] [--theme light|dark] [--out-dir dir]
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch').default || require('pixelmatch');
const { launch, prepare } = require('./render');

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1]; };
const file = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!file) { console.error('usage: node cli/compare.js <conversa.json> [--scale 3] [--theme light|dark] [--out-dir dir]'); process.exit(2); }
const scale = +opt('scale', 3), theme = opt('theme', 'light'), outDir = opt('out-dir', path.join(require('os').tmpdir(), 'whatsgen-compare'));

async function webPng(r, conv, jsonDir) {
  // mesmas condições da interface: janela de desktop (1rem fica fracionário) e exportação do app.js (html-to-image)
  const page = await r.browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 1 });
    await page.goto(r.server.url, { waitUntil: 'load' });
    const prepared = prepare(conv, jsonDir, r.server, () => {});
    const b64 = await page.evaluate(async (c, theme, n) => {
      document.getElementById('upload').hidden = true; document.getElementById('viewer').hidden = false;
      await window.whatsgen.render(c, { theme });
      const blob = await window.whatsgen.capture(n);
      const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return btoa(s);
    }, prepared, theme, scale);
    return Buffer.from(b64, 'base64');
  } finally { await page.close(); }
}

(async () => {
  const conv = JSON.parse(fs.readFileSync(file, 'utf8')), jsonDir = path.dirname(path.resolve(file));
  fs.mkdirSync(outDir, { recursive: true });
  const r = await launch();
  let cliBuf, webBuf;
  try {
    cliBuf = await r.render(conv, { scale, format: 'png', theme, jsonDir });
    webBuf = await webPng(r, conv, jsonDir);
  } finally { await r.close(); }
  const a = PNG.sync.read(cliBuf), b = PNG.sync.read(webBuf);
  const base = path.basename(file, '.json') + `-${theme}-${scale}x`;
  fs.writeFileSync(path.join(outDir, base + '.cli.png'), cliBuf);
  fs.writeFileSync(path.join(outDir, base + '.web.png'), webBuf);

  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  const px = (img, x, y, c) => img.data[(y * img.width + x) * 4 + c];
  // pixel "sem par": diferença > 32 e nenhum pixel num raio de R px na outra imagem se parece com ele (separa deslocamento/antialiasing de conteúdo diferente)
  const R = 2, near = (x, y) => { let best = 255; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; let m = 0; for (let c = 0; c < 3; c++) m = Math.max(m, Math.abs(px(a, x, y, c) - px(b, xx, yy, c))); if (m < best) best = m; } return best; };
  let unmatched = 0;
  let sum = 0, n1 = 0, n8 = 0, n32 = 0, max = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
  const diff = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let m = 0;
    for (let c = 0; c < 3; c++) { const d = Math.abs(px(a, x, y, c) - px(b, x, y, c)); sum += d; if (d > m) m = d; }
    if (m > 0) n1++; if (m > 8) n8++; if (m > 32) { n32++; if (near(x, y) > 32) unmatched++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    if (m > max) max = m;
    const o = (y * w + x) * 4, v = Math.min(255, m * 4);
    diff.data[o] = 255; diff.data[o + 1] = 255 - v; diff.data[o + 2] = 255 - v; diff.data[o + 3] = 255;
  }
  fs.writeFileSync(path.join(outDir, base + '.diff.png'), PNG.sync.write(diff));
  const crop = img => { const o = new PNG({ width: w, height: h }); PNG.bitblt(img, o, 0, 0, w, h, 0, 0); return o; };
  const pm = pixelmatch(crop(a).data, crop(b).data, null, w, h, { threshold: 0.1 });
  const total = w * h, pct = v => (100 * v / total).toFixed(3) + '%';
  console.log(`${file}  (theme=${theme}, scale=${scale})`);
  console.log(`  size   cli ${a.width}x${a.height} | web ${b.width}x${b.height}${a.width === b.width && a.height === b.height ? '' : '  (compared on the common ' + w + 'x' + h + ' top-left area)'}`);
  console.log(`  mean abs diff per channel: ${(sum / (total * 3)).toFixed(4)} / 255`);
  console.log(`  pixels differing at all:   ${n1} (${pct(n1)})`);
  console.log(`  differing by > 8/255:      ${n8} (${pct(n8)})`);
  console.log(`  differing by > 32/255:     ${n32} (${pct(n32)})${n32 ? `  bbox x ${x0}-${x1}, y ${y0}-${y1}` : ''}`);
  console.log(`  > 32/255 even within ${R}px:  ${unmatched} (${pct(unmatched)})   <- real content differences, not just 1-2px shifts`);
  console.log(`  max channel diff:          ${max}/255`);
  console.log(`  pixelmatch (threshold .1): ${pm} (${pct(pm)})`);
  console.log(`  files: ${path.join(outDir, base)}.{cli,web,diff}.png`);
})().catch(e => { console.error(e); process.exit(1); });
