(()=>{
const G=window.EVO,$=id=>document.getElementById(id),I=G.input,C=$('game');
const keys=new Set();
let jid=null,bid=null;
I.mode='mouse';I.mouseX=1;I.mouseY=0;

const movementCodes=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
const boostCodes=new Set(['Space','ShiftLeft','ShiftRight']);
function modeLabel(mode){return mode==='keyboard'?'WASD':mode==='touch'?'手机摇杆':'鼠标跟随'}
function setMode(mode){I.mode=mode;const el=$('inputMode');if(el)el.textContent=modeLabel(mode)}
function normalize(x,y){const d=Math.hypot(x,y);return d>.001?{x:x/d,y:y/d}:null}
function keyboardVector(){let x=0,y=0;if(keys.has('KeyW')||keys.has('ArrowUp'))y-=1;if(keys.has('KeyS')||keys.has('ArrowDown'))y+=1;if(keys.has('KeyA')||keys.has('ArrowLeft'))x-=1;if(keys.has('KeyD')||keys.has('ArrowRight'))x+=1;return normalize(x,y)}

// Called from the game loop every frame. This avoids stale keydown/keyup directions.
G.updateControls=()=>{
 if(I.mode==='keyboard'){
   const v=keyboardVector();
   if(v){I.x=v.x;I.y=v.y}
 }else if(I.mode==='mouse'){
   I.x=I.mouseX;I.y=I.mouseY;
 }
};

// Desktop mouse-follow. Direction is screen-centre relative because the camera follows the player.
C.addEventListener('pointermove',e=>{
 if(e.pointerType&&e.pointerType!=='mouse')return;
 const v=normalize(e.clientX-G.vw/2,e.clientY-G.vh/2);if(!v)return;
 I.mouseX=v.x;I.mouseY=v.y;setMode('mouse');
});

// Desktop keyboard: WASD + arrows. Space/Shift boost.
addEventListener('keydown',e=>{
 if(movementCodes.has(e.code)){
   e.preventDefault();keys.add(e.code);setMode('keyboard');G.updateControls();
 }
 if(boostCodes.has(e.code)){
   e.preventDefault();I.boost=true;$('boostBtn')?.classList.add('pressed');
 }
});
addEventListener('keyup',e=>{
 if(movementCodes.has(e.code)){keys.delete(e.code);G.updateControls()}
 if(boostCodes.has(e.code)){I.boost=false;$('boostBtn')?.classList.remove('pressed')}
});
addEventListener('blur',()=>{keys.clear();I.boost=false;$('boostBtn')?.classList.remove('pressed')});

// Mobile virtual joystick.
const joy=$('joystick'),knob=joy.querySelector('.joy-knob');
function moveJoy(e){
 const r=joy.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,v=normalize(x,y);if(!v)return;
 const max=r.width*.34,m=Math.min(max,Math.hypot(x,y));I.x=v.x;I.y=v.y;knob.style.transform=`translate(${v.x*m}px,${v.y*m}px)`;setMode('touch');
}
joy.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();jid=e.pointerId;try{joy.setPointerCapture(jid)}catch{}moveJoy(e)});
joy.addEventListener('pointermove',e=>{if(e.pointerId===jid){e.preventDefault();moveJoy(e)}});
function endJoy(e){if(jid===null)return;if(!e||e.pointerId===jid){jid=null;knob.style.transform=''}}
joy.addEventListener('pointerup',endJoy);joy.addEventListener('pointercancel',endJoy);joy.addEventListener('lostpointercapture',endJoy);

// Mobile boost. Pointer capture prevents a small finger drift from cancelling boost.
const boost=$('boostBtn');
function boostOn(e){e.preventDefault();e.stopPropagation();bid=e.pointerId;try{boost.setPointerCapture(bid)}catch{}I.boost=true;boost.classList.add('pressed');setMode('touch')}
function boostOff(e){if(bid!==null&&e&&e.pointerId!==bid)return;bid=null;I.boost=false;boost.classList.remove('pressed')}
boost.addEventListener('pointerdown',boostOn);boost.addEventListener('pointerup',boostOff);boost.addEventListener('pointercancel',boostOff);boost.addEventListener('lostpointercapture',boostOff);

function start(){const desktop=matchMedia('(pointer:fine)').matches;setMode(desktop?'mouse':'touch');keys.clear();I.boost=false;G.reset()}
$('startBtn').onclick=start;$('restartBtn').onclick=start;
})();