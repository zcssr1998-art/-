const {clamp}=require('./config');
class Input{
  constructor(platform,game,renderer){this.p=platform;this.g=game;this.r=renderer;this.joy={cx:90,cy:platform.height-82,r:58,dx:0,dy:0,id:null};this.boostRect={cx:platform.width-88,cy:platform.height-82,r:54,id:null};this.bind()}
  layout(){this.joy.cx=Math.max(78,Math.min(105,this.p.width*.1));this.joy.cy=this.p.height-78;this.joy.r=Math.max(48,Math.min(62,this.p.height*.15));this.boostRect.cx=this.p.width-Math.max(78,Math.min(102,this.p.width*.1));this.boostRect.cy=this.p.height-78;this.boostRect.r=Math.max(46,Math.min(58,this.p.height*.145))}
  pt(t){return{x:t.clientX!=null?t.clientX:t.x,y:t.clientY!=null?t.clientY:t.y,id:t.identifier!=null?t.identifier:t.id}}
  inside(p,b){return b&&p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h}
  moveJoy(p){const j=this.joy,dx=p.x-j.cx,dy=p.y-j.cy,d=Math.hypot(dx,dy)||1,m=Math.min(j.r*.74,d);j.dx=dx/d*m;j.dy=dy/d*m}
  uiTap(p){const h=this.r.hitboxes,state=this.g.state;if(state==='intro'){if(this.inside(p,h.prev)){this.g.cycleSkin(-1);return true}if(this.inside(p,h.next)){this.g.cycleSkin(1);return true}if(this.inside(p,h.random)){this.g.randomSkin();return true}if(this.inside(p,h.start)){this.g.start();this.p.vibrate();return true}}else if(state==='gameover'){if(this.inside(p,h.restart)){this.g.start();this.p.vibrate();return true}}else if(state==='upgrade'){for(let i=0;i<(h.upgrade||[]).length;i++)if(this.inside(p,h.upgrade[i])){this.g.chooseBuff(i);this.p.vibrate();return true}}return false}
  bind(){
    this.p.onTouchStart(e=>{this.layout();const ts=e.changedTouches||e.touches||[];for(const t of ts){const p=this.pt(t);if(this.g.state!=='playing'){this.uiTap(p);continue}if(p.x<this.p.width*.56){if(this.joy.id==null){this.joy.id=p.id;this.moveJoy(p)}}else if(this.boostRect.id==null){this.boostRect.id=p.id;if(this.g.player)this.g.player.boosting=true}}});
    this.p.onTouchMove(e=>{const ts=e.changedTouches||e.touches||[];for(const t of ts){const p=this.pt(t);if(p.id===this.joy.id)this.moveJoy(p);if(p.id===this.boostRect.id&&this.g.player)this.g.player.boosting=true}});
    const end=e=>{const ts=e.changedTouches||[];for(const t of ts){const p=this.pt(t);if(p.id===this.joy.id){this.joy.id=null;this.joy.dx=0;this.joy.dy=0}if(p.id===this.boostRect.id){this.boostRect.id=null;if(this.g.player)this.g.player.boosting=false}}};
    this.p.onTouchEnd(end);this.p.onTouchCancel(end)
  }
  apply(){this.layout();const P=this.g.player;if(this.g.state!=='playing'||!P||P.dead)return;if(this.joy.id!=null){const d=Math.hypot(this.joy.dx,this.joy.dy);if(d>4)P.ta=Math.atan2(this.joy.dy,this.joy.dx)}if(this.boostRect.id==null)P.boosting=false}
}
module.exports={Input};