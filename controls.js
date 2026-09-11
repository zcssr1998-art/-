(()=>{
const G=window.EVO,$=id=>document.getElementById(id),I=G.input;
addEventListener('mousemove',e=>{const x=e.clientX-G.vw/2,y=e.clientY-G.vh/2,d=Math.hypot(x,y)||1;I.x=x/d;I.y=y/d});
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key===' ')I.boost=true;if(e.key==='ArrowUp'){I.x=0;I.y=-1}if(e.key==='ArrowDown'){I.x=0;I.y=1}if(e.key==='ArrowLeft'){I.x=-1;I.y=0}if(e.key==='ArrowRight'){I.x=1;I.y=0}});
addEventListener('keyup',e=>{if(e.key===' ')I.boost=false});
const joy=$('joystick'),knob=joy.querySelector('.joy-knob');let jid=null;
function move(e){const r=joy.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.hypot(x,y)||1,m=Math.min(r.width*.3,d);I.x=x/d;I.y=y/d;knob.style.transform=`translate(${I.x*m}px,${I.y*m}px)`}
joy.addEventListener('pointerdown',e=>{jid=e.pointerId;joy.setPointerCapture(jid);move(e)});
joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)move(e)});
joy.addEventListener('pointerup',()=>{jid=null;knob.style.transform='' });
const boost=$('boostBtn');boost.addEventListener('pointerdown',e=>{e.preventDefault();I.boost=true;boost.classList.add('pressed')});
['pointerup','pointercancel','pointerleave'].forEach(ev=>boost.addEventListener(ev,()=>{I.boost=false;boost.classList.remove('pressed')}));
$('startBtn').onclick=G.reset;$('restartBtn').onclick=G.reset;
})();