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

// ---------- flow: upload the JSON -> rendered conversation -> export PNG ----------
const $=id=>document.getElementById(id), upload=$('upload'), viewer=$('viewer'), errBox=$('error'), fileIn=$('file'), drop=$('drop');
let currentName='chat';
function showError(msg){ errBox.textContent=msg; errBox.hidden=!msg; }
async function open(conv){
  if(!conv || typeof conv!=='object' || !Array.isArray(conv.turns)) throw new Error('Invalid JSON: the "turns" list is missing.');
  upload.hidden=true; viewer.hidden=false; showError(''); currentName=(conv.contact&&conv.contact.name)||'chat';
  await whatsgen.render(conv);
}
async function loadFile(f){
  try{ await open(JSON.parse(await f.text())); }
  catch(e){ upload.hidden=false; viewer.hidden=true; showError('Could not read the file "'+f.name+'".\n'+e.message); }
}
async function loadUrl(u){
  try{ const r=await fetch(u,{cache:'no-store'}); if(!r.ok) throw new Error("HTTP "+r.status); await open(await r.json()); }
  catch(e){ upload.hidden=false; viewer.hidden=true; showError('Could not load "'+u+'".\n'+e.message+'\nOpen this page through a local server (e.g. start.bat, start.sh or python -m http.server).'); }
}
fileIn.addEventListener('change',()=>{ if(fileIn.files[0]) loadFile(fileIn.files[0]); fileIn.value=''; });
['dragenter','dragover'].forEach(ev=>addEventListener(ev,e=>{ e.preventDefault(); drop.classList.add('over'); }));
['dragleave','drop'].forEach(ev=>addEventListener(ev,e=>{ e.preventDefault(); drop.classList.remove('over'); }));
addEventListener('drop',e=>{ const f=e.dataTransfer.files[0]; if(f) loadFile(f); });
$('sample').onclick=()=>loadUrl('conversations/default.json');
$('back').onclick=()=>{ viewer.hidden=true; upload.hidden=false; };
if(params.get('chat')) loadUrl(params.get('chat'));   // shortcut: ?chat=conversations/x.json skips the upload

// captures what is visible on the phone (including the scroll position) as a Blob, at scale N.
// Fixes 1rem = 1px during the capture: the result does not depend on the window size, and the CLI uses this same function.
async function captureBlob(N, type="image/png", quality=0.92){
  const phone=document.querySelector(".phone"), scroll=msgs.scrollTop, oldRem=parseFloat(getComputedStyle(root).fontSize), atBottom=scroll>=msgs.scrollHeight-msgs.clientHeight-1;
  if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
  try{
    await document.fonts.ready;
    root.style.fontSize="1px";
    msgs.style.overflow="hidden"; msgs.scrollTop=0;
    // at the bottom of the chat use the exact measure (scrollTop is rounded to whole pixels and would depend on the window size)
    const shift=atBottom ? Math.max(0, thread.getBoundingClientRect().height-msgs.getBoundingClientRect().height) : scroll/oldRem;
    thread.style.transform="translateY("+(-shift)+"px)";
    const box=phone.getBoundingClientRect();
    const canvas=await htmlToImage.toCanvas(phone,{pixelRatio:N, canvasWidth:box.width, canvasHeight:box.height, cacheBust:false, skipAutoScale:true});
    return await new Promise((res,rej)=>canvas.toBlob(b=>b?res(b):rej(new Error("empty canvas")), type, quality));
  } finally { root.style.fontSize=""; msgs.style.overflow=""; thread.style.transform=""; msgs.scrollTop=scroll; }
}
window.whatsgen.capture=captureBlob;

async function exportPng(){
  const btn=$("export");
  btn.disabled=true; btn.textContent="Generating…";
  try{
    const blob=await captureBlob(+$("res").value);
    const a=document.createElement("a"), d=new Date(), pad=n=>String(n).padStart(2,"0");
    const stamp=d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+"-"+pad(d.getHours())+pad(d.getMinutes())+pad(d.getSeconds());
    a.href=URL.createObjectURL(blob);
    a.download=(currentName.normalize("NFD").replace(/[^\w]+/g,"-").replace(/^-|-$/g,"").toLowerCase()||"chat")+"-"+stamp+".png";
    document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    window.__lastExport=blob;
  }catch(e){ console.error(e); alert("Could not generate the image: "+(e&&e.message||e)); }
  finally{ btn.disabled=false; btn.textContent="Export PNG"; }
}
$("export").onclick=exportPng;
