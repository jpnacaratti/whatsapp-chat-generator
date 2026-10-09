# whats_gen

Maquete de chat do WhatsApp (Android) em HTML, alimentada por JSON.

## Rodar

```bash
python -m http.server 8765
```

Abra `http://localhost:8765/chat.html`. Parâmetros opcionais:

- `?chat=conversations/outra.json` — carrega outra conversa (padrão: `conversations/default.json`)
- `?theme=light|dark` — força o tema (padrão: o do sistema)

Também dá para arrastar um `.json` para dentro da página.

## Formato do JSON

```json
{
  "contact": { "name": "Teste M", "avatar": "assets/chat/avatar.jpg" },
  "theme": "auto",
  "encryptionNotice": true,
  "turns": [
    { "date": "8 de outubro de 2025" },
    { "from": "them", "messages": [
      { "text": "Oi!", "time": "17:25" },
      { "image": "assets/chat/foto.jpg", "caption": "opcional", "time": "17:26" }
    ]},
    { "from": "me", "messages": [
      { "text": "Olá", "time": "17:39", "status": "read" }
    ]}
  ]
}
```

- `from`: `me` (balão verde, à direita) ou `them` (à esquerda). Só a primeira mensagem de cada turno ganha o "rabinho".
- `status` (só para `me`): `sent` ✓, `delivered` ✓✓ cinza (padrão), `read` ✓✓ azul.
- `{ "date": "..." }` insere uma etiqueta de data.
- `contact.avatar` e `theme` são opcionais.
