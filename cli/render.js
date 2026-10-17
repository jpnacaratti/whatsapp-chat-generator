'use strict';
// Renders a conversation on the web/ page with a headless Chromium and returns the image.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { startServer, WEB_ROOT } = require('./server');
const { findBrowser } = require('./browser');

// the viewport only needs to fit the phone (393.5 x 800 px); the scale comes from whatsgen.capture
const VIEWPORT = { width: 426, height: 948 };

const isUrl = p => /^(https?:|data:|blob:)/i.test(p);

// Image paths in the JSON: relative to the JSON, then to web/, then to the current directory; absolute paths as they are.
function resolveImage(p, jsonDir, server) {
  if (!p || isUrl(p)) return { value: p };
  const tries = path.isAbsolute(p) ? [p] : [path.resolve(jsonDir, p), path.join(WEB_ROOT, p), path.resolve(p)];
  const hit = tries.find(f => fs.existsSync(f));
  return hit ? { value: server.addFile(hit) } : { value: p, missing: true };
}

function prepare(conv, jsonDir, server, warn) {
  const out = JSON.parse(JSON.stringify(conv));
  const fix = (obj, key) => {
    if (!obj || !obj[key]) return;
    const r = resolveImage(obj[key], jsonDir, server);
    if (r.missing) warn(`image not found: ${obj[key]}`);
    obj[key] = r.value;
  };
  fix(out.contact, 'avatar');
  for (const t of out.turns || []) for (const m of t.messages || []) fix(m, 'image');
  return out;
}

async function launch(browserPath) {
  const server = await startServer();
  const browser = await puppeteer.launch({ executablePath: findBrowser(browserPath), headless: true, args: ['--hide-scrollbars'] });
  return {
    server,
    browser,
    async render(conv, opts) {
      const page = await browser.newPage();
      try {
        await page.setViewport({ ...VIEWPORT, deviceScaleFactor: 1 });
        await page.goto(server.url, { waitUntil: 'load' });
        const prepared = prepare(conv, opts.jsonDir || process.cwd(), server, opts.warn || (() => {}));
        const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }[opts.format];
        // the same function the interface "Export" button uses (web/js/app.js: whatsgen.capture)
        const b64 = await page.evaluate(async (c, theme, scale, type, quality) => {
          document.getElementById('upload').hidden = true;
          document.getElementById('viewer').hidden = false;
          await window.whatsgen.render(c, { theme });
          const buf = new Uint8Array(await (await window.whatsgen.capture(scale, type, quality)).arrayBuffer());
          let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
          return btoa(s);
        }, prepared, opts.theme, opts.scale, mime, opts.quality / 100);
        return Buffer.from(b64, 'base64');
      } finally { await page.close(); }
    },
    async close() { await browser.close(); await server.close(); },
  };
}

module.exports = { launch, prepare, VIEWPORT };
