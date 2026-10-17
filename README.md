# WhatsApp Chat Generator

Generates WhatsApp (Android) chat screenshots: you upload a JSON file, the conversation is rendered (light or dark theme) and exported as a high-resolution image, either from the web interface or from the command line.

## Layout

```
web/      the web interface (index.html, css/, js/, assets/, conversations/ samples)
cli/      the command-line tool (whatsgen) and a pixel-comparison script
```

## Web interface

Double-click `start.bat` on Windows, or run `./start.sh` on Linux/macOS (or run `python -m http.server 8765` and open `http://localhost:8765/`).

1. The page opens on an upload screen: choose or drag the conversation `.json` (or click "Use the sample conversation").
2. The conversation is rendered in a phone frame, with an action bar above it. Scroll the conversation to the moment you want.
3. Pick the resolution and click **Export PNG**: whatever is visible on the phone (including the scroll position) is saved as a PNG.
   - 2x = 787×1600, 3x = 1180×2400, 4x = 1574×3200.
4. The **Theme** button toggles light/dark before exporting; **Change JSON** goes back to the upload screen.

Optional URL parameters: `?chat=conversations/other.json` (skips the upload) and `?theme=light|dark`.

It must be opened through a local server (not straight from the file), because images and fonts are read during the export. The scripts serve the `web/` folder.

## Command line

Requires Node 18+ and a Chrome, Chromium or Edge already installed (nothing is downloaded). Works on Windows, Linux and macOS.

```bash
npm install
node cli/whatsgen.js web/conversations/default.json            # -> web/conversations/default.png
node cli/whatsgen.js chat.json -o chat-dark.jpg -t dark -s 4   # format from the extension
node cli/whatsgen.js chats/*.json -d out -f webp -q 85         # several files
node cli/whatsgen.js --help
```

Or install the `whatsgen` command with `npm install -g .` (or `npm link`).

| Option | Default | Meaning |
| --- | --- | --- |
| `-o, --output <file>` | `<input>.<format>` next to the JSON | Output file (one input only); `-` writes to stdout |
| `-d, --out-dir <dir>` | next to each JSON | Output directory |
| `-f, --format` | `png` (or the `-o` extension) | `png`, `jpeg` or `webp` |
| `-s, --scale <n>` | `3` | Resolution multiplier, 0.5–8 (base 393.5×800 px) |
| `-t, --theme` | the JSON `theme`, else `light` | `light`, `dark` or `auto` |
| `-q, --quality` | `92` | JPEG/WebP quality |
| `--browser <path>` | auto-detected | Chrome/Chromium/Edge executable (or set `CHROME_PATH`) |

Use `-` as the input to read the JSON from stdin. Image paths in the JSON are looked up relative to the JSON file, then to `web/`, then to the current directory. Exit code is 0 on success, 1 on errors, 2 on bad usage.

The CLI loads the same page as the web interface in a headless browser and calls the same capture function as the **Export** button (`whatsgen.capture` in `web/js/app.js`), so both produce the same image: same size (`floor(393.5 × scale)` × `800 × scale`) and pixel-identical output, whatever the window size. It exports the conversation scrolled to the bottom, like the app does after loading.

`npm run compare -- <conversation.json> [--scale 3] [--theme dark]` checks this: it renders the JSON through the CLI and through the web page (at a desktop window size) and prints the pixel difference, which should be 0. The images and a diff map go to the system temp folder. The guarantee holds for the same browser engine; another browser or version may anti-alias text slightly differently.

> The WhatsApp texts the app draws on its own (encryption notice, default call labels) are in English. Call labels can be overridden per message with `title` and `subtitle`, as in `web/conversations/default.json`.

## JSON format

```json
{
  "contact": { "name": "Test M", "avatar": "assets/chat/avatar.jpg" },
  "theme": "auto",
  "encryptionNotice": true,
  "turns": [
    { "date": "October 8, 2025" },
    { "from": "them", "messages": [
      { "text": "Hi!", "time": "17:25" },
      { "image": "assets/chat/photo.jpg", "caption": "optional", "time": "17:26" }
    ]},
    { "from": "me", "messages": [
      { "text": "Hello", "time": "17:39", "status": "read" }
    ]}
  ]
}
```

- `from`: `me` (green bubble, on the right) or `them` (on the left). Only the first message of each turn gets the bubble tail.
- `status` (`me` only): `sent` ✓, `delivered` ✓✓ gray (default), `read` ✓✓ blue.
- Calls: `{ "call": { "type": "voice", "status": "answered", "duration": "7 min" }, "time": "12:31" }`
  - `type`: `voice` (default) or `video`
  - `status`: `answered` (shows `duration`), `answered-elsewhere` ("Call answered on another device") or `missed` (red icon; "Missed call" if incoming, "No answer" if outgoing)
  - `direction` (optional): `incoming` or `outgoing`; by default it comes from `from` (`them` = incoming, `me` = outgoing)
  - `title` and `subtitle` (optional) replace the default texts
- Reactions (on any message: text, image or call): `"reactions": ["😂"]`
  - each item is one person's reaction; with more than one, the small bubble shows the emojis (up to 3) and the total
  - also accepts `{ "emoji": "👍", "count": 3 }` for several people with the same emoji
- Images (`image`, with optional `caption`) always have the same width (274 px of the layout); the photo is scaled up or down without distortion and cropped if it is very tall.
- `{ "date": "..." }` inserts a date label.
- `contact.name` and `contact.avatar` (path to an image) change the name and photo in the header. Without `avatar`, or if the image fails to load, the default silhouette is shown; without `name`, "Test M". Example photo: `web/assets/chat/avatar-exemplo.jpg`.
- `theme` is optional (`auto`, `light` or `dark`).

## Emojis

Any emoji written in the JSON (text, caption, call title or reaction) is shown with the official WhatsApp image, with no extra setup.

- The mapping is by Unicode code point: the emoji becomes `<codepoints>.png` (without `fe0f`, e.g. 👍🏽 → `1f44d-1f3fd.png`) in `web/assets/emoji/`. The list of available emojis is in `web/assets/emoji/index.json`.
- There are currently 3,289 emojis (about 94% of the simple ones, 82% of those with skin tones and part of the combined ones). An emoji that is not in the list is shown with the system emoji.
- They were cut from the original WhatsApp Web sprites (`web/assets/emoji-sprites/`) and matched to their Unicode code point by visual similarity against a reference set, so an occasional neighbor may be swapped. To fix or add one, replace or save the PNG (40×40) named after its code point and include it in `index.json`.
- `web/conversations/emojis.json` is an example for testing.
