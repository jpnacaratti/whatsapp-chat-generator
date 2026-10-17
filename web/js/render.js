const MIC='<path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.900V22h2v-3.100A7 7 0 0 0 19 12z"/>';
const SEND='<path d="M3.400 20.400l17.500-7.500a1 1 0 0 0 0-1.800L3.400 3.600a1 1 0 0 0-1.400 1.200L4 11l9 1-9 1-2 6.200a1 1 0 0 0 1.400 1.200z"/>';
const TAIL='<svg class="tail" viewBox="0 0 8 13"><path d="M5.188,0H0v11.193l6.467-8.625C7.526,1.156,6.958,0,5.188,0z"/></svg>';
const CHECK_L='M14.73 6.01a1 1 0 0 1 1.41-.15l.01.01a1 1 0 0 1 .15 1.41L7.6 18.01a1 1 0 0 1-.73.37h-.05c-.26 0-.52-.11-.71-.3l-4.03-4.09a.99.99 0 0 1 0-1.41.99.99 0 0 1 1.41 0l3.25 3.29 7.99-9.86Z';
const CHECK_R='M20.44 6.13a1 1 0 0 1 1.41-.15h-.01a1 1 0 0 1 .15 1.41l-8.41 10.45a1 1 0 0 1-.73.37h-.05a1 1 0 0 1-.71-.3l-1.36-1.26a.55.55 0 0 1-.02-.81l.56-.68c.21-.2.53-.21.75-.03l.71.58 7.71-9.58Z';
const tick = s => s === 'sent'
  ? '<svg class="tick" viewBox="0 0 24 24"><path d="'+CHECK_R+'"/></svg>'
  : '<svg class="tick '+(s === 'read' ? 'read' : '')+'" viewBox="0 0 24 24"><path d="'+CHECK_L+CHECK_R+'"/></svg>';


const root=document.documentElement, msgs=document.getElementById("msgs"), thread=document.getElementById("thread");
const params=new URLSearchParams(location.search);
const now=()=>new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
const toBottom=()=>{ msgs.scrollTop=msgs.scrollHeight; };

// opts.theme (light|dark|auto) wins; then ?theme= in the URL; then the JSON theme
function applyTheme(pref, force){
const v=force||params.get("theme")||pref||"auto";
root.dataset.theme = v==="auto" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark":"light") : v;
}

function el(tag, cls, html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
function meta(m, dir){
  const status = m.status || (dir==='out' ? 'delivered' : null);
  return el('span','meta', (m.time||now()) + (dir==='out' ? tick(status) : ''));
}
function bubble(m, dir, first){
  const b=el('div','m '+dir+(first?' first':'')+(m.image?' img':''), first?TAIL:'');
  if(m.image){
    b.append(el('div','fwd','<svg viewBox="0 0 24 24"><path d="M19.18 11 15.3 7.12a.97.97 0 0 1-.3-.7c0-.28.1-.52.3-.72.2-.18.44-.28.71-.28.28 0 .5.1.69.28l4.6 4.6c.1.1.17.2.21.32a1.2 1.2 0 0 1 0 .76.88.88 0 0 1-.21.32l-4.6 4.6a.9.9 0 0 1-.7.29c-.27-.01-.5-.1-.7-.29a1 1 0 0 1-.31-.7.87.87 0 0 1 .29-.7l3.9-3.9Zm-6 1H7c-.83 0-1.54.3-2.13.88A2.9 2.9 0 0 0 4 15v3c0 .28-.1.52-.29.71A.94.94 0 0 1 3 19a.97.97 0 0 1-.71-.29A.97.97 0 0 1 2 18v-3c0-1.38.49-2.56 1.46-3.54A4.82 4.82 0 0 1 7 10h6.18L10.3 7.12a.97.97 0 0 1-.3-.7c0-.28.1-.52.3-.72.2-.18.44-.28.71-.28.28 0 .5.1.69.28l4.6 4.6c.1.1.17.2.21.32a1.2 1.2 0 0 1 0 .76.88.88 0 0 1-.21.32l-4.6 4.6a.9.9 0 0 1-.7.29c-.27-.01-.5-.1-.7-.29a1 1 0 0 1-.31-.7.87.87 0 0 1 .29-.7l2.9-2.9Z"/></svg>'));
    const pic=el('div','pic'); const img=new Image(); img.src=m.image; img.alt=''; img.onload=toBottom; pic.append(img);
    if(m.caption){ b.append(pic); const c=el('span','cap'); richText(c,m.caption); c.append(meta(m,dir)); b.append(c); }
    else { const sh=el('div','shade'); sh.append(meta(m,dir)); pic.append(sh); b.append(pic); }
  } else {
    const s=el('span'); richText(s,m.text); b.append(s, meta(m,dir));
  }
  return b;
}
// chamadas: { "call": { "type":"voice|video", "status":"answered|answered-elsewhere|missed", "duration":"7 min", "direction":"incoming|outgoing", "title":"...", "subtitle":"..." } }
const HANDSET='M19.95 21c-2.08 0-4.14-.45-6.17-1.36a18.3 18.3 0 0 1-5.55-3.87 18.47 18.47 0 0 1-3.87-5.54C3.46 8.18 3 6.13 3 4.04A1.02 1.02 0 0 1 4.05 3H8.1c.23 0 .44.08.63.24a.9.9 0 0 1 .32.56l.65 3.5c.03.27.03.5-.02.67-.05.19-.15.35-.28.48L6.97 10.9c.34.62.73 1.21 1.2 1.79.45.57.96 1.13 1.5 1.66A17.59 17.59 0 0 0 13.1 17l2.35-2.35a1.61 1.61 0 0 1 1.3-.4l3.45.7c.23.07.43.19.57.36.16.18.23.37.23.59v4.05A1.02 1.02 0 0 1 19.95 21Z', VIDEO='M4 20c-.55 0-1.02-.2-1.41-.59-.4-.39-.59-.86-.59-1.41V6c0-.55.2-1.02.59-1.41C2.98 4.19 3.45 4 4 4h12c.55 0 1.02.2 1.41.59.4.39.59.86.59 1.41v4.5l3.15-3.15c.17-.17.35-.2.55-.13.2.09.3.25.3.48v8.6c0 .23-.1.4-.3.47-.2.09-.38.05-.55-.12L18 13.5V18c0 .55-.2 1.02-.59 1.41-.39.4-.86.59-1.41.59H4Z';
function callIcon(c, outgoing){
  const arrow = outgoing ? '<path fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M14.5 9.5 19.800 4.200M15.300 4.200h4.500v4.500"/>'
                         : '<path fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M19.800 4.200 14.500 9.500M14.500 5.300v4.200h4.200"/>';
  const body = c.type==='video' ? '<path stroke="none" transform="translate(1 4) scale(.8)" d="'+VIDEO+'"/>' : '<path stroke="none" d="'+HANDSET+'"/>';
  return '<svg viewBox="0 0 24 24">'+body+arrow+'</svg>';
}
function callBubble(m, dir, first){
  const c=m.call||{}, outgoing = (c.direction ? c.direction==='outgoing' : dir==='out'), video=c.type==='video', st=c.status||'answered';
  const title = c.title || (video ? 'Video call' : 'Voice call');
  const sub = c.subtitle || ({
    'answered': c.duration || 'Call answered',
    'answered-elsewhere': 'Call answered on another device',
    'missed': outgoing ? 'No answer' : 'Missed call'
  })[st] || '';
  const b=el('div','m '+dir+(first?' first':'')+' call', first?TAIL:'');
  const card=el('div','call-card'), ico=el('div','call-ico'+(st==='missed'?' missed':''), callIcon(c, outgoing)), txt=el('div','call-txt');
  const ti=el('div','call-title'); richText(ti,title);
  const su=el('div','call-sub'); const s=el('span'); s.textContent=sub; su.append(s, el('span','meta',m.time||now()));
  txt.append(ti,su); card.append(ico,txt); b.append(card); return b;
}
// reactions: "reactions": ["😂"]  or  [{ "emoji": "👍", "count": 3 }]  (several people = several items)
// official WhatsApp emojis: assets/emoji/<codepoints>.png (without fe0f); if missing, falls back to the system emoji
// assets/emoji/index.json lists the available emojis (mapping: emoji -> codepoints -> PNG)
let EMOJI=null;
const emojiReady=fetch('assets/emoji/index.json').then(r=>r.json()).then(a=>{ EMOJI=new Set(a); }).catch(()=>{});
const emojiName=ch=>[...ch].map(c=>c.codePointAt(0).toString(16)).filter(c=>c!=='fe0f').join('-');
function emojiEl(ch){
  const name=emojiName(ch);
  if(EMOJI && !EMOJI.has(name)) return document.createTextNode(ch);
  const img=new Image(); img.alt=ch; img.draggable=false;
  img.onerror=()=>img.replaceWith(document.createTextNode(ch));
  img.src='assets/emoji/'+name+'.png'; return img;
}
// text with emojis -> text runs + <img class="emo"> with the official WhatsApp emoji
const segmenter=window.Intl&&Intl.Segmenter ? new Intl.Segmenter(undefined,{granularity:'grapheme'}) : null;
const isEmoji=g=>/\p{Extended_Pictographic}|\p{Regional_Indicator}|^[0-9#*]️?⃣/u.test(g);
function richText(node, str){
  str=str||''; if(!segmenter){ node.append(str); return; }
  let buf='';
  for(const {segment:g} of segmenter.segment(str)){
    if(!isEmoji(g)){ buf+=g; continue; }
    if(buf){ node.append(buf); buf=''; }
    const e=emojiEl(g); if(e.nodeType===1) e.classList.add('emo'); node.append(e);
  }
  if(buf) node.append(buf);
}
function addReactions(b, m){
  const list=(m.reactions||[]).map(r=>typeof r==='string' ? {emoji:r,count:1} : {emoji:r.emoji,count:r.count||1}).filter(r=>r.emoji);
  if(!list.length) return b;
  const total=list.reduce((s,r)=>s+r.count,0), pill=el('div','react');
  list.slice(0,3).forEach(r=>pill.append(emojiEl(r.emoji)));
  if(total>1){ const n=el('span','n'); n.textContent=total; pill.append(n); }
  b.classList.add('has-react'); b.append(pill); return b;
}
function notice(){
  return el('div','notice','<svg viewBox="0 0 9 11"><path d="M7.500 4H7V3a2.500 2.500 0 0 0-5 0v1h-.5A.5.500 0 0 0 1 4.500v5a.5.500 0 0 0 .5.500h6a.5.500 0 0 0 .5-.5v-5A.5.500 0 0 0 7.500 4zM3 3a1.500 1.500 0 0 1 3 0v1H3z"/></svg>Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them. <b>Learn more</b>');
}
function chip(label){ const c=el('div','chip'); c.textContent=label; return c; }

const DEFAULT_NAME=document.getElementById('contactName').textContent, DEFAULT_AVATAR=document.getElementById('avatar').innerHTML;
let last=null, avatarReady=Promise.resolve();
function render(conv, opts={}){
  thread.replaceChildren(); last=null;
  const c=conv.contact||{};
  const name=c.name||DEFAULT_NAME;
  document.getElementById('contactName').textContent=name; document.title=name;
  const av=document.getElementById('avatar'); av.innerHTML=DEFAULT_AVATAR;
  avatarReady=Promise.resolve();
  if(c.avatar){ avatarReady=new Promise(res=>{ const im=new Image(); im.alt=''; im.style.cssText='width:100%;height:100%;object-fit:cover;display:block'; im.onload=()=>{ av.replaceChildren(im); res(); }; im.onerror=res; im.src=c.avatar; }); }
  applyTheme(conv.theme, opts.theme);
  const turns=(conv.turns||[]).slice();
  if(turns[0] && turns[0].date) thread.append(chip(turns.shift().date));
  if(conv.encryptionNotice!==false) thread.append(notice());
  for(const t of turns){
    if(t.date){ thread.append(chip(t.date)); last=null; continue; }
    const dir = t.from==='me' ? 'out' : 'in';
    (t.messages||[]).forEach((m,i)=>thread.append(addReactions(m.call ? callBubble(m,dir,i===0) : bubble(m,dir,i===0), m)));
    last=dir;
  }
  toBottom();
}

// waits for every <img> in the phone (photos, emojis, avatar) to finish loading
const imagesReady=()=>Promise.all([avatarReady, ...[...document.querySelectorAll(".phone img")].map(i=>i.complete ? 0 : new Promise(r=>{ i.addEventListener("load",r); i.addEventListener("error",r); }))]);

// API used by app.js and the CLI: window.whatsgen.render(conv, {theme}) -> promise resolved once everything has loaded
window.whatsgen = { async render(conv, opts={}){ await emojiReady; render(conv, opts); await document.fonts.ready; await imagesReady(); toBottom(); } };
