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
- Chamadas: `{ "call": { "type": "voice", "status": "answered", "duration": "7 min" }, "time": "12:31" }`
  - `type`: `voice` (padrão) ou `video`
  - `status`: `answered` (mostra `duration`), `answered-elsewhere` ("Ligação atendida em outro dispositivo") ou `missed` (ícone vermelho; "Ligação perdida" se recebida, "Sem resposta" se feita por você)
  - `direction` (opcional): `incoming` ou `outgoing`; por padrão vem de `from` (`them` = recebida, `me` = feita)
  - `title` e `subtitle` (opcionais) substituem os textos padrão
- Reações (em qualquer mensagem: texto, imagem ou chamada): `"reactions": ["😂"]`
  - cada item é uma reação de uma pessoa; com mais de uma, o balãozinho mostra os emojis (até 3) e o total
  - também aceita `{ "emoji": "👍", "count": 3 }` para várias pessoas com o mesmo emoji
  - os emojis são as imagens oficiais do WhatsApp Web, recortadas dos sprites. Estão em `assets/emoji/` só os 6 das reações rápidas: 👍 ❤️ 😂 😮 😢 🙏. Qualquer outro emoji aparece com o emoji do sistema; para adicionar um, salve o PNG como `assets/emoji/<codepoints>.png` (ex.: `1f44d.png`, sem o `fe0f`)
- `{ "date": "..." }` insere uma etiqueta de data.
- `contact.name` e `contact.avatar` (caminho de uma imagem) trocam o nome e a foto do cabeçalho. Sem `avatar`, ou se a imagem não carregar, aparece a silhueta padrão; sem `name`, "Teste M". Exemplo de foto: `assets/chat/avatar-exemplo.jpg`.
- `theme` é opcional (`auto`, `light` ou `dark`).
