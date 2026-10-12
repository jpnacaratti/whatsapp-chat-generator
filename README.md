# WhatsApp Chat Generator

Gerador de prints de conversas do WhatsApp (Android): você envia um JSON, a conversa é renderizada (tema claro ou escuro) e exportada em PNG de alta resolução.

## Rodar

Dê dois cliques em `start.bat` (ou rode `python -m http.server 8765` e abra `http://localhost:8765/`).

1. A página abre numa tela de upload: escolha ou arraste o `.json` da conversa (ou use "Usar conversa de exemplo").
2. A conversa aparece no formato do celular, com a barra de ações acima. Role a conversa até o momento que quiser.
3. Escolha a resolução e clique em **Exportar PNG**: o que está visível no celular (incluindo a posição da rolagem) é salvo como PNG.
   - 2x = 787×1600, 3x = 1181×2400, 4x = 1574×3200.
4. O botão **Tema** alterna claro/escuro antes de exportar; **Trocar JSON** volta ao upload.

Parâmetros opcionais da URL: `?chat=conversations/outra.json` (pula o upload) e `?theme=light|dark`.

É preciso abrir por um servidor local (não direto do arquivo), porque as imagens e fontes são lidas durante a exportação.

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
- Imagens (`image`, com `caption` opcional) sempre ocupam a mesma largura (274 px do layout); a foto é ampliada ou reduzida sem distorcer e recortada se for muito alta.
- `{ "date": "..." }` insere uma etiqueta de data.
- `contact.name` e `contact.avatar` (caminho de uma imagem) trocam o nome e a foto do cabeçalho. Sem `avatar`, ou se a imagem não carregar, aparece a silhueta padrão; sem `name`, "Teste M". Exemplo de foto: `assets/chat/avatar-exemplo.jpg`.
- `theme` é opcional (`auto`, `light` ou `dark`).

## Emojis

Qualquer emoji escrito no JSON (texto, legenda, título de chamada ou reação) aparece com a imagem oficial do WhatsApp, sem configuração extra.

- O de-para é pelo código Unicode: o emoji vira `<codepoints>.png` (sem o `fe0f`, ex.: 👍🏽 → `1f44d-1f3fd.png`) em `assets/emoji/`. A lista dos disponíveis fica em `assets/emoji/index.json`.
- Hoje são 3.289 emojis (cerca de 94% dos simples, 82% dos com tom de pele e parte dos combinados). Emoji que não está na lista aparece com o emoji do sistema.
- Eles foram recortados dos sprites originais do WhatsApp Web (`assets/emoji-sprites/`) e associados ao código Unicode por semelhança visual com um conjunto de referência; um ou outro vizinho pode estar trocado. Para corrigir ou adicionar um, substitua ou salve o PNG (40×40) com o nome do código e inclua-o no `index.json`.
- `conversations/emojis.json` é um exemplo para testar.
