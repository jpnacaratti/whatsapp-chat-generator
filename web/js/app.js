const input=document.getElementById("in"), icon=document.getElementById("sendIcon"), cam=document.getElementById("cam");
document.getElementById('themeBtn').onclick=()=>root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';
applyTheme();

function send(){
  const v=input.value.trim(); if(!v) return;
  const first=last!=='out'; last='out';
  thread.append(bubble({text:v,time:now(),status:'delivered'},'out',first)); toBottom();
  input.value=''; sync();
}
function sync(){ const t=input.value.trim(); icon.innerHTML=t?SEND:MIC; cam.style.display=t?'none':'block'; }
input.addEventListener('input',sync);
input.addEventListener('keydown',e=>e.key==='Enter'&&send());
document.getElementById('send').onclick=send;

// ---------- fluxo: upload do JSON -> conversa renderizada -> exportar PNG ----------
const $=id=>document.getElementById(id), upload=$('upload'), viewer=$('viewer'), errBox=$('error'), fileIn=$('file'), drop=$('drop');
let currentName='conversa';
function showError(msg){ errBox.textContent=msg; errBox.hidden=!msg; }
async function open(conv){
  if(!conv || typeof conv!=='object' || !Array.isArray(conv.turns)) throw new Error('JSON inválido: faltou a lista "turns".');
  upload.hidden=true; viewer.hidden=false; showError(''); currentName=(conv.contact&&conv.contact.name)||'conversa';
  await whatsgen.render(conv);
}
async function loadFile(f){
  try{ await open(JSON.parse(await f.text())); }
  catch(e){ upload.hidden=false; viewer.hidden=true; showError('Não consegui ler o arquivo "'+f.name+'".\n'+e.message); }
}
async function loadUrl(u){
  try{ const r=await fetch(u,{cache:'no-store'}); if(!r.ok) throw new Error("HTTP "+r.status); await open(await r.json()); }
  catch(e){ upload.hidden=false; viewer.hidden=true; showError('Não consegui carregar "'+u+'".\n'+e.message+'\nAbra esta página por um servidor local (ex.: start.bat ou python -m http.server).'); }
}
fileIn.addEventListener('change',()=>{ if(fileIn.files[0]) loadFile(fileIn.files[0]); fileIn.value=''; });
['dragenter','dragover'].forEach(ev=>addEventListener(ev,e=>{ e.preventDefault(); drop.classList.add('over'); }));
['dragleave','drop'].forEach(ev=>addEventListener(ev,e=>{ e.preventDefault(); drop.classList.remove('over'); }));
addEventListener('drop',e=>{ const f=e.dataTransfer.files[0]; if(f) loadFile(f); });
$('sample').onclick=()=>loadUrl('conversations/default.json');
$('back').onclick=()=>{ viewer.hidden=true; upload.hidden=false; };
if(params.get('chat')) loadUrl(params.get('chat'));   // atalho: ?chat=conversations/x.json pula o upload

// captura o que está visível no celular (inclusive a posição da rolagem) como Blob, na escala N.
// Fixa 1rem = 1px durante a captura: o resultado não depende do tamanho da janela, e o CLI usa esta mesma função.
async function captureBlob(N, type="image/png", quality=0.92){
  const phone=document.querySelector(".phone"), scroll=msgs.scrollTop, oldRem=parseFloat(getComputedStyle(root).fontSize), atBottom=scroll>=msgs.scrollHeight-msgs.clientHeight-1;
  if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
  try{
    await document.fonts.ready;
    root.style.fontSize="1px";
    msgs.style.overflow="hidden"; msgs.scrollTop=0;
    // no fim da conversa usa a medida exata (o scrollTop é arredondado em pixels inteiros e dependeria do tamanho da janela)
    const shift=atBottom ? Math.max(0, thread.getBoundingClientRect().height-msgs.getBoundingClientRect().height) : scroll/oldRem;
    thread.style.transform="translateY("+(-shift)+"px)";
    const box=phone.getBoundingClientRect();
    const canvas=await htmlToImage.toCanvas(phone,{pixelRatio:N, canvasWidth:box.width, canvasHeight:box.height, cacheBust:false, skipAutoScale:true});
    return await new Promise((res,rej)=>canvas.toBlob(b=>b?res(b):rej(new Error("canvas vazio")), type, quality));
  } finally { root.style.fontSize=""; msgs.style.overflow=""; thread.style.transform=""; msgs.scrollTop=scroll; }
}
window.whatsgen.capture=captureBlob;

async function exportPng(){
  const btn=$("export");
  btn.disabled=true; btn.textContent="Gerando…";
  try{
    const blob=await captureBlob(+$("res").value);
    const a=document.createElement("a"), d=new Date(), pad=n=>String(n).padStart(2,"0");
    const stamp=d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+"-"+pad(d.getHours())+pad(d.getMinutes())+pad(d.getSeconds());
    a.href=URL.createObjectURL(blob);
    a.download=(currentName.normalize("NFD").replace(/[^w]+/g,"-").replace(/^-|-$/g,"").toLowerCase()||"conversa")+"-"+stamp+".png";
    document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    window.__lastExport=blob;
  }catch(e){ console.error(e); alert("Não consegui gerar o PNG: "+(e&&e.message||e)); }
  finally{ btn.disabled=false; btn.textContent="Exportar PNG"; }
}
$("export").onclick=exportPng;
