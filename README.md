# WhatsApp Chat Generator

Generates WhatsApp (Android) chat screenshots: you upload a JSON file, the conversation is rendered (light or dark theme) and exported as a high-resolution PNG.

## Running

Double-click `start.bat` on Windows, or run `./start.sh` on Linux/macOS (or run `python -m http.server 8765` and open `http://localhost:8765/`).

1. The page opens on an upload screen: choose or drag the conversation `.json` (or click "Usar conversa de exemplo").
2. The conversation is rendered in a phone frame, with an action bar above it. Scroll the conversation to the moment you want.
3. Pick the resolution and click **Exportar PNG**: whatever is visible on the phone (including the scroll position) is saved as a PNG.
   - 2x = 787×1600, 3x = 1181×2400, 4x = 1574×3200.
4. The **Tema** button toggles light/dark before exporting; **Trocar JSON** goes back to the upload screen.

Optional URL parameters: `?chat=conversations/other.json` (skips the upload) and `?theme=light|dark`.

It must be opened through a local server (not straight from the file), because images and fonts are read during the export.

> The app interface and the WhatsApp texts it draws on its own (encryption notice, default call labels) are in Portuguese. Call labels can be overridden per message with `title` and `subtitle`, as in `conversations/default.json`.

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
  - `status`: `answered` (shows `duration`), `answered-elsewhere` ("Ligação atendida em outro dispositivo") or `missed` (red icon; "Ligação perdida" if incoming, "Sem resposta" if outgoing)
  - `direction` (optional): `incoming` or `outgoing`; by default it comes from `from` (`them` = incoming, `me` = outgoing)
  - `title` and `subtitle` (optional) replace the default texts
- Reactions (on any message: text, image or call): `"reactions": ["😂"]`
  - each item is one person's reaction; with more than one, the small bubble shows the emojis (up to 3) and the total
  - also accepts `{ "emoji": "👍", "count": 3 }` for several people with the same emoji
- Images (`image`, with optional `caption`) always have the same width (274 px of the layout); the photo is scaled up or down without distortion and cropped if it is very tall.
- `{ "date": "..." }` inserts a date label.
- `contact.name` and `contact.avatar` (path to an image) change the name and photo in the header. Without `avatar`, or if the image fails to load, the default silhouette is shown; without `name`, "Teste M". Example photo: `assets/chat/avatar-exemplo.jpg`.
- `theme` is optional (`auto`, `light` or `dark`).

## Emojis

Any emoji written in the JSON (text, caption, call title or reaction) is shown with the official WhatsApp image, with no extra setup.

- The mapping is by Unicode code point: the emoji becomes `<codepoints>.png` (without `fe0f`, e.g. 👍🏽 → `1f44d-1f3fd.png`) in `assets/emoji/`. The list of available emojis is in `assets/emoji/index.json`.
- There are currently 3,289 emojis (about 94% of the simple ones, 82% of those with skin tones and part of the combined ones). An emoji that is not in the list is shown with the system emoji.
- They were cut from the original WhatsApp Web sprites (`assets/emoji-sprites/`) and matched to their Unicode code point by visual similarity against a reference set, so an occasional neighbor may be swapped. To fix or add one, replace or save the PNG (40×40) named after its code point and include it in `index.json`.
- `conversations/emojis.json` is an example for testing.
