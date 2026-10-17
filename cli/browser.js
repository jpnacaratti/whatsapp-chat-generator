'use strict';
// Finds an installed Chrome/Chromium/Edge (puppeteer-core does not download a browser).
const fs = require('fs');
const path = require('path');

function candidates() {
  const env = process.env;
  if (process.platform === 'win32') {
    const roots = [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean);
    const rel = [['Google', 'Chrome', 'Application', 'chrome.exe'], ['Microsoft', 'Edge', 'Application', 'msedge.exe'], ['Chromium', 'Application', 'chrome.exe']];
    return roots.flatMap(r => rel.map(x => path.join(r, ...x)));
  }
  if (process.platform === 'darwin') {
    return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'];
  }
  const names = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'microsoft-edge-stable'];
  return (env.PATH || '').split(path.delimiter).flatMap(d => names.map(n => path.join(d, n)))
    .concat(['/snap/bin/chromium', '/usr/bin/chromium']);
}

function findBrowser(explicit) {
  const list = [explicit, process.env.CHROME_PATH, ...candidates()].filter(Boolean);
  const found = list.find(p => fs.existsSync(p));
  if (!found) {
    throw new Error('No Chrome/Chromium/Edge found. Install one, or pass --browser <path> (or set CHROME_PATH).');
  }
  return found;
}

module.exports = { findBrowser };
