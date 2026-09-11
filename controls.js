(()=>{
const G=window.EVO,$=id=>document.getElementById(id),I=G.input,C=$('game'),keys=new Set();let jid=null,bid=null,pendingStart=false,startBusy=false;
I.mode='mouse';I.mouseX=1;I.mouseY=0;
const movementCodes=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']),boostCodes=new Set(['Space','ShiftLeft','ShiftRight']);
const mobile=()=>matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
const landscape=()=>innerWidth>=innerHeight;
function modeLabel(mode){return mode==='keyboard'?'WASD':mode==='touch'?'手机摇杆':'鼠标跟随'}
function setMode(mode){I.mode=mode;const el=$('inputMode');if(el)el.textContent=modeLabel(mode)}
function normalize(x,y){const d=Math.hypot(x,y);return d>.001?{x:x/d,y:y/d}:null}
function keyboardVector(){let x=0,y=0;if(keys.has('KeyW')||keys.has('ArrowUp'))y-=1;if(keys.has('KeyS')||keys.has('ArrowDown'))y+=1;if(keys.has('KeyA')||keys.has('ArrowLeft'))x-=1;if(keys.has('KeyD')||keys.has('ArrowRight'))x+=1;return normalize(x,y)}
function gate(show){const e=$('rotateGate');if(e)e.classList.toggle('hidden',!show)}
async function tryLandscape(){if(!mobile()||landscape())return true;try{if(document.documentElement.requestFullscreen&&!document.fullscreenElement)await document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(()=>{});if(screen.orientation?.lock)await screen.orientation.lock('landscape').catch(()=>{})}catch{}await new Promise(r=>setTimeout(r,260));return landscape()}
G.updateControls=()=>{if(I.mode==='keyboard'){const v=keyboardVector();if(v){I.x=v.x;I.y=v.y}}else if(I.mode==='mouse'){I.x=I.mouseX;I.y=I.mouseY}};
C.addEventListener('pointermove',e=>{if(e.pointerType&&e.pointerType!=='mouse')return;const r=C.getBoundingClientRect(),v=normalize(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2);if(!v)return;I.mouseX=v.x;I.mouseY=v.y;setMode('mouse')});
addEventListener('keydown',e=>{if(movementCodes.has(e.code)){e.preventDefault();keys.add(e.code);setMode('keyboard');G.updateControls()}if(boostCodes.has(e.code)){e.preventDefault();I.boost=true;$('boostBtn')?.classList.add('pressed')}});
addEventListener('keyup',e=>{if(movementCodes.has(e.code)){keys.delete(e.code);G.updateControls()}if(boostCodes.has(e.code)){I.boost=false;$('boostBtn')?.classList.remove('pressed')}});
addEventListener('blur',()=>{keys.clear();I.boost=false;$('boostBtn')?.classList.remove('pressed')});
const joy=$('joystick'),knob=joy.querySelector('.joy-knob');
function moveJoy(e){const r=joy.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,v=normalize(x,y);if(!v)return;const max=Math.min(r.width,r.height)*.34,m=Math.min(max,Math.hypot(x,y));I.x=v.x;I.y=v.y;knob.style.transform=`translate(${v.x*m}px,${v.y*m}px)`;setMode('touch')}
joy.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();jid=e.pointerId;try{joy.setPointerCapture(jid)}catch{}moveJoy(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===jid){e.preventDefault();moveJoy(e)}});function endJoy(e){if(jid===null)return;if(!e||e.pointerId===jid){jid=null;knob.style.transform=''}}joy.addEventListener('pointerup',endJoy);joy.addEventListener('pointercancel',endJoy);joy.addEventListener('lostpointercapture',endJoy);
const boost=$('boostBtn');function boostOn(e){e.preventDefault();e.stopPropagation();bid=e.pointerId;try{boost.setPointerCapture(bid)}catch{}I.boost=true;boost.classList.add('pressed');setMode('touch')}function boostOff(e){if(bid!==null&&e&&e.pointerId!==bid)return;bid=null;I.boost=false;boost.classList.remove('pressed')}boost.addEventListener('pointerdown',boostOn);boost.addEventListener('pointerup',boostOff);boost.addEventListener('pointercancel',boostOff);boost.addEventListener('lostpointercapture',boostOff);
function actualStart(){pendingStart=false;gate(false);setMode(mobile()?'touch':'mouse');keys.clear();I.boost=false;G.reset()}
async function start(){if(startBusy)return;startBusy=true;try{if(mobile()&&!landscape()){pendingStart=true;const ok=await tryLandscape();if(!ok){gate(true);return}}actualStart()}finally{startBusy=false}}
function orientationSync(){setTimeout(()=>{if(!mobile())return;if(landscape()){gate(false);if(pendingStart&&!G.isRunning?.())actualStart()}else if(G.isRunning?.()||pendingStart)gate(true)},180)}
addEventListener('orientationchange',orientationSync);addEventListener('resize',orientationSync);screen.orientation?.addEventListener?.('change',orientationSync);
$('rotateTry')?.addEventListener('click',async()=>{const ok=await tryLandscape();if(ok&&pendingStart&&!G.isRunning?.())actualStart();else gate(!landscape())});
$('startBtn').onclick=start;$('restartBtn').onclick=start;
})();