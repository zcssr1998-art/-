(()=>{
const G=window.EVO,$=id=>document.getElementById(id),I=G.input,C=$('game');
I.mode='mouse';
const keys=new Set();
const modeEl=()=>$('inputMode');
function setMode(mode,label){I.mode=mode;const el=modeEl();if(el)el.textContent=label}
function normalize(x,y){const d=Math.hypot(x,y);if(d<.001)return null;return{x:x/d,y:y/d}}
function applyKeyboard(){let x=0,y=0;if(keys.has('KeyW')||keys.has('ArrowUp'))y-=1;if(keys.has('KeyS')||keys.has('ArrowDown'))y+=1;if(keys.has('KeyA')||keys.has('ArrowLeft'))x-=1;if(keys.has('KeyD')||keys.has('ArrowRight'))x+=1;const v=normalize(x,y);if(v){I.x=v.x;I.y=v.y}}

// PC mouse-follow: moving the mouse over the playfield immediately switches back to mouse mode.
C.addEventListener('mousemove',e=>{if(e.buttons&&e.button!==0)return;const x=e.clientX-G.vw/2,y=e.clientY-G.vh/2,v=normalize(x,y);if(!v)return;I.x=v.x;I.y=v.y;setMode('mouse','鼠标跟随')});

// PC keyboard: WASD and arrows both work; Space/Shift = boost.
addEventListener('keydown',e=>{const movement=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];if(movement.includes(e.code)){e.preventDefault();keys.add(e.code);applyKeyboard();setMode('keyboard','WASD')}if(e.code==='Space'||e.code==='ShiftLeft'||e.code==='ShiftRight'){e.preventDefault();I.boost=true;$('boostBtn')?.classList.add('pressed')}});
addEventListener('keyup',e=>{keys.delete(e.code);if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))applyKeyboard();if(e.code==='Space'||e.code==='ShiftLeft'||e.code==='ShiftRight'){I.boost=false;$('boostBtn')?.classList.remove('pressed')}});
addEventListener('blur',()=>{keys.clear();I.boost=false;$('boostBtn')?.classList.remove('pressed')});

// Mobile virtual joystick with pointer capture so WeChat/browser finger drift does not lose control.
const joy=$('joystick'),knob=joy.querySelector('.joy-knob');let jid=null;
function moveJoy(e){const r=joy.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,v=normalize(x,y);if(!v)return;const m=Math.min(r.width*.3,Math.hypot(x,y));I.x=v.x;I.y=v.y;knob.style.transform=`translate(${v.x*m}px,${v.y*m}px)`;setMode('touch','手机摇杆')}
joy.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();jid=e.pointerId;try{joy.setPointerCapture(jid)}catch{}moveJoy(e)});
joy.addEventListener('pointermove',e=>{if(e.pointerId===jid){e.preventDefault();moveJoy(e)}});
function endJoy(e){if(jid===null)return;if(!e||e.pointerId===jid){jid=null;knob.style.transform=''}}
joy.addEventListener('pointerup',endJoy);joy.addEventListener('pointercancel',endJoy);joy.addEventListener('lostpointercapture',endJoy);

// Boost button: capture the pointer and only release on pointerup/cancel. Do not cancel on pointerleave.
const boost=$('boostBtn');let bid=null;
function boostOn(e){e.preventDefault();e.stopPropagation();bid=e.pointerId;try{boost.setPointerCapture(bid)}catch{}I.boost=true;boost.classList.add('pressed');setMode('touch','手机摇杆');if(G.player&&G.player.score<=55)G.toast?.('长度不足，无法继续冲刺')}
function boostOff(e){if(bid!==null&&e&&e.pointerId!==bid)return;bid=null;I.boost=false;boost.classList.remove('pressed')}
boost.addEventListener('pointerdown',boostOn);boost.addEventListener('pointerup',boostOff);boost.addEventListener('pointercancel',boostOff);boost.addEventListener('lostpointercapture',boostOff);
addEventListener('pointerup',e=>{if(bid!==null)boostOff(e)});

$('startBtn').onclick=()=>{setMode(matchMedia('(pointer:fine)').matches?'mouse':'touch',matchMedia('(pointer:fine)').matches?'鼠标跟随':'手机摇杆');G.reset()};
$('restartBtn').onclick=()=>{setMode(matchMedia('(pointer:fine)').matches?'mouse':'touch',matchMedia('(pointer:fine)').matches?'鼠标跟随':'手机摇杆');G.reset()};
})();