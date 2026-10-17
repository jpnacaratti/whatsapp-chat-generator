#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { parseArgs } = require('util');

const HELP = `whatsgen - generate WhatsApp (Android) chat screenshots from a JSON file

Usage:
  whatsgen <conversation.json> [more.json ...] [options]
  cat conversation.json | whatsgen - -o chat.png

Options:
  -o, --output <file>     Output file (single input only). "-" writes to stdout.
                          Default: <input name>.<format> next to the JSON.
  -d, --out-dir <dir>     Output directory (default: next to each JSON).
  -f, --format <fmt>      png | jpeg | webp (default: png, or taken from -o extension).
  -s, --scale <n>         Resolution multiplier, 0.5 to 8 (default: 3 -> 1181x2400).
                          Base size is 393.5x800 px; 2 -> 787x1600, 4 -> 1574x3200.
  -t, --theme <theme>     light | dark | auto (default: the JSON "theme", else light).
  -q, --quality <1-100>   JPEG/WebP quality (default: 92).
      --browser <path>    Chrome/Chromium/Edge executable (default: auto-detect,
                          or the CHROME_PATH environment variable).
  -h, --help              Show this help.
  -v, --version           Show the version.

JSON format: see README.md. Image paths in the JSON are looked up relative to the
JSON file, then to web/, then to the current directory.

Examples:
  whatsgen web/conversations/default.json
  whatsgen chat.json -o chat-dark.jpg -t dark -s 4
  whatsgen chats/*.json -d out -f webp -q 85
`;

const FORMATS = { png: 'png', jpg: 'jpeg', jpeg: 'jpeg', webp: 'webp' };
const fail = (msg, code = 2) => { process.stderr.write(`whatsgen: ${msg}\nTry "whatsgen --help".\n`); process.exit(code); };

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', c => chunks.push(c)).on('end', () => resolve(Buffer.concat(chunks).toString('utf8'))).on('error', reject);
  });
}

async function main() {
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        output: { type: 'string', short: 'o' }, 'out-dir': { type: 'string', short: 'd' }, format: { type: 'string', short: 'f' },
        scale: { type: 'string', short: 's' }, theme: { type: 'string', short: 't' }, quality: { type: 'string', short: 'q' },
        browser: { type: 'string' }, help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'v' },
      },
    });
  } catch (e) { fail(e.message); }
  const { values: v, positionals: inputs } = parsed;

  if (v.help) return void process.stdout.write(HELP);
  if (v.version) return void console.log(require('../package.json').version);
  if (!inputs.length) { process.stdout.write(HELP); process.exit(2); }

  const scale = v.scale == null ? 3 : Number(v.scale);
  if (!(scale >= 0.5 && scale <= 8)) fail('--scale must be a number between 0.5 and 8.');
  const quality = v.quality == null ? 92 : Number(v.quality);
  if (!(quality >= 1 && quality <= 100)) fail('--quality must be between 1 and 100.');
  if (v.theme && !['light', 'dark', 'auto'].includes(v.theme)) fail('--theme must be light, dark or auto.');
  if (v.output && inputs.length > 1) fail('--output works with a single input; use --out-dir for several.');
  if (v.output && v['out-dir']) fail('use either --output or --out-dir, not both.');

  let format = v.format ? FORMATS[v.format.toLowerCase()] : null;
  if (v.format && !format) fail('--format must be png, jpeg or webp.');
  if (!format && v.output && v.output !== '-') format = FORMATS[path.extname(v.output).slice(1).toLowerCase()];
  format = format || 'png';
  const ext = format === 'jpeg' ? 'jpg' : format;

  // lê e valida tudo antes de abrir o navegador
  const jobs = [];
  for (const input of inputs) {
    let text, jsonDir, base;
    try {
      if (input === '-') { text = await readStdin(); jsonDir = process.cwd(); base = 'conversa'; }
      else { text = fs.readFileSync(input, 'utf8'); jsonDir = path.dirname(path.resolve(input)); base = path.basename(input, path.extname(input)); }
    } catch (e) { fail(`cannot read "${input}": ${e.message}`, 1); }
    let conv;
    try { conv = JSON.parse(text); } catch (e) { fail(`"${input}" is not valid JSON: ${e.message}`, 1); }
    if (!conv || typeof conv !== 'object' || !Array.isArray(conv.turns)) fail(`"${input}": invalid conversation, the "turns" list is missing.`, 1);
    let out = v.output;
    if (!out) out = path.join(v['out-dir'] || (input === '-' ? process.cwd() : jsonDir), `${base}.${ext}`);
    jobs.push({ input, conv, jsonDir, out });
  }
  if (v['out-dir']) fs.mkdirSync(v['out-dir'], { recursive: true });

  const { launch } = require('./render');
  let r;
  try { r = await launch(v.browser); } catch (e) { fail(e.message, 1); }
  let failed = 0;
  try {
    for (const j of jobs) {
      try {
        const buf = await r.render(j.conv, {
          scale, format, quality, theme: v.theme, jsonDir: j.jsonDir,
          warn: m => process.stderr.write(`whatsgen: warning (${j.input}): ${m}\n`),
        });
        if (j.out === '-') await new Promise(res => process.stdout.write(buf, res));
        else { fs.writeFileSync(j.out, buf); console.error(`${j.input} -> ${j.out}`); }
      } catch (e) { failed++; process.stderr.write(`whatsgen: failed on "${j.input}": ${e.message}\n`); }
    }
  } finally { await r.close(); }
  process.exit(failed ? 1 : 0);
}

main().catch(e => { process.stderr.write(`whatsgen: ${e.stack || e}\n`); process.exit(1); });
