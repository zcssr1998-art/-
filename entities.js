(()=>{
const G=window.EVO,{rnd,pick,clamp,angleDiff}=G;
class Food{
 constructor(x=rnd(40,G.WORLD.w-40),y=rnd(40,G.WORLD.h-40),v=rnd(2,7),c=pick(['#86ffe1','#72e9ff','#ffdf7a','#ff91c8','#c39bff','#baff7f'])){Object.assign(this,{x,y,v,c,r:3+Math.sqrt(v),dead:false})}
 draw(){if(G.drawFoodSprite)return G.drawFoodSprite(this);const p=G.screen(this.x,this.y),r=this.r*G.camera.z;if(p.x<-20||p.x>G.vw+20||p.y<-20||p.y>G.vh+20)return;G.ctx.fillStyle=this.c;G.ctx.beginPath();G.ctx.arc(p.x,p.y,r,0,G.TAU);G.ctx.fill()}
}
class Snake{
 constructor({ai=false,name='小团子',score=80,x=rnd(300,G.WORLD.w-300),y=rnd(300,G.WORLD.h-300),palette=pick(G.palettes),style=pick(G.botStyles)}={}){
  Object.assign(this,{ai,name,score,x,y,palette,style,a:rnd(0,G.TAU),ta:0,dead:false,body:[],mag:28,speed:1,boost:1,turn:1,feast:1,orbiters:0,boostCost:1,buffs:[],inv:.8,think:0,target:null,boosting:false,kills:0,trail:0,fins:0,killBonus:0,aiState:'wander',stateUntil:0,stuckClock:0,stuckX:x,stuckY:y,stuckLevel:0,escapeA:0,simAccum:0,seed:Math.random()*99,senseClock:0,eatClock:0,collisionClock:0,steerX:0,steerY:0,nearCount:0,nearestThreatD:1e9,nearestThreat:null});
  this.ta=this.a;this.escapeA=this.a;for(let i=0;i<36;i++)this.body.push({x:x-i*5.2,y})
 }
 get stage(){return G.stageFor(this)}get radius(){return this.stage[2]}get maxBody(){return 30+Math.floor(Math.sqrt(this.score)*2.55)}
 update(dt){
  if(this.dead)return;this.inv=Math.max(0,this.inv-dt);if(this.ai)this.brain(dt);
  const sizePenalty=1+Math.min(.28,Math.sqrt(this.score)/155),turnRate=5.9*this.turn/sizePenalty;
  this.a+=clamp(angleDiff(this.a,this.ta),-turnRate*dt,turnRate*dt);
  const boosting=this.boosting&&this.score>55,cruise=(138+Math.min(34,Math.sqrt(this.score)*.72))*this.speed,v=cruise*(boosting?1.72*this.boost:1);
  this.x+=Math.cos(this.a)*v*dt;this.y+=Math.sin(this.a)*v*dt;
  if(this.x<70||this.x>G.WORLD.w-70||this.y<70||this.y>G.WORLD.h-70)this.ta=Math.atan2(G.WORLD.h/2-this.y,G.WORLD.w/2-this.x);
  this.x=clamp(this.x,10,G.WORLD.w-10);this.y=clamp(this.y,10,G.WORLD.h-10);
  const h=this.body[0];if(Math.hypot(this.x-h.x,this.y-h.y)>4.4)this.body.unshift({x:this.x,y:this.y});while(this.body.length>this.maxBody)this.body.pop();
  if(boosting)this.score=Math.max(50,this.score-dt*7.5*this.boostCost);
  this.eatClock-=dt;if(!this.ai||this.eatClock<=0){this.eatClock=this.ai?.05:0;this.eatFood()}
  this.collisionClock-=dt;if(this.inv<=0&&(!this.ai||this.collisionClock<=0)){this.collisionClock=this.ai?.034:0;this.checkCollision()}
 }
 brain(dt){
  this.stuckClock+=dt;this.think-=dt;this.senseClock-=dt;
  if(this.stuckClock>=.78){const moved=Math.hypot(this.x-this.stuckX,this.y-this.stuckY);this.stuckLevel=moved<48?this.stuckLevel+1:Math.max(0,this.stuckLevel-1);this.stuckX=this.x;this.stuckY=this.y;this.stuckClock=0;if(this.stuckLevel>=2){this.aiState='unstuck';this.stateUntil=G.time+1.15;this.escapeA=this.a+(Math.random()<.5?-1:1)*rnd(.85,1.55);this.stuckLevel=0}}
  if(this.senseClock<=0)this.sense();
  let tx=this.target?.x??G.WORLD.w/2,ty=this.target?.y??G.WORLD.h/2;
  if(this.aiState==='unstuck'){tx=this.x+Math.cos(this.escapeA)*420;ty=this.y+Math.sin(this.escapeA)*420;this.boosting=true}
  else if(this.aiState==='flee'){
   const t=this.target;if(t){tx=this.x+(this.x-t.x)*2.2;ty=this.y+(this.y-t.y)*2.2}else{tx=this.x+this.steerX;ty=this.y+this.steerY}this.boosting=this.nearestThreatD<185
  }else if(this.aiState==='hunt'&&this.target instanceof Snake){
   const t=this.target,lead=this.style==='伏击型'?245:155,side=this.style==='疯狗型'?0:Math.sin(this.seed)*72;tx=t.x+Math.cos(t.a)*lead+Math.cos(t.a+Math.PI/2)*side;ty=t.y+Math.sin(t.a)*lead+Math.sin(t.a+Math.PI/2)*side;const d=Math.hypot(t.x-this.x,t.y-this.y);this.boosting=d>210&&d<720
  }else this.boosting=false;
  const crowd=this.nearCount>=7?1.9:1,dx=tx-this.x+this.steerX*crowd,dy=ty-this.y+this.steerY*crowd;if(this.nearCount>=7)this.boosting=false;if(Math.abs(dx)+Math.abs(dy)>1)this.ta=Math.atan2(dy,dx)+Math.sin(G.time*1.7+this.seed)*.018
 }
 sense(){
  const grid=G.spatial,P=G.player,distP=P&&!P.dead?Math.hypot(this.x-P.x,this.y-P.y):0;this.senseClock=distP<G.SIM.near?rnd(.075,.105):distP<G.SIM.mid?rnd(.14,.21):rnd(.32,.48);
  const heads=grid?grid.headsNear(this.x,this.y,620):G.snakes.filter(s=>!s.dead),body=grid?grid.bodiesNear(this.x,this.y,175):[];
  let sepX=0,sepY=0,avoidX=0,avoidY=0,nearestThreat=null,nearestThreatD=1e9,nearCount=0;
  for(const o of heads){if(o===this||o.dead)continue;const dx=this.x-o.x,dy=this.y-o.y,d=Math.hypot(dx,dy)||1;if(d<190)nearCount++;if(d<115){const q=(115-d)/115;sepX+=dx/d*q*140;sepY+=dy/d*q*140}const toward=Math.abs(angleDiff(o.a,Math.atan2(this.y-o.y,this.x-o.x)))<.72;if((toward&&d<270)||d<105){if(d<nearestThreatD){nearestThreat=o;nearestThreatD=d}}}
  for(const p of body){const owner=p.owner;if(!owner||owner===this||owner.dead)continue;const dx=this.x-p.x,dy=this.y-p.y,d=Math.hypot(dx,dy)||1;if(d<150){const q=(150-d)/150;avoidX+=dx/d*q*260;avoidY+=dy/d*q*260}}
  this.steerX=sepX+avoidX;this.steerY=sepY+avoidY;this.nearCount=nearCount;this.nearestThreat=nearestThreat;this.nearestThreatD=nearestThreatD;
  if(this.think>0&&G.time<this.stateUntil&&!this.target?.dead)return;
  this.think=distP>G.SIM.mid?rnd(.65,1.25):rnd(.18,.42);
  const foods=grid?grid.foodsNear(this.x,this.y,620):G.foods;let nearestFood=null,fd=1e9;for(const f of foods){if(f.dead)continue;const d=(f.x-this.x)**2+(f.y-this.y)**2;if(d<fd){fd=d;nearestFood=f}}
  let nearestSnake=null,sd=1e9;for(const o of heads){if(o===this||o.dead||o.inv>0)continue;const d=(o.x-this.x)**2+(o.y-this.y)**2;if(d<sd){sd=d;nearestSnake=o}}
  const playerNear=P&&!P.dead&&P.inv<=0&&distP<1150;
  if(this.stuckLevel>=2){this.aiState='unstuck';this.escapeA=this.a+(Math.random()<.5?-1:1)*rnd(.9,1.6);this.stateUntil=G.time+1.1}
  else if(nearCount>=7||nearestThreatD<120){this.aiState='flee';this.target=nearestThreat;this.stateUntil=G.time+rnd(.45,.85)}
  else if(this.style==='谨慎型'&&nearestSnake&&Math.sqrt(sd)<360){this.aiState='flee';this.target=nearestSnake;this.stateUntil=G.time+rnd(.55,1)}
  else if(this.style==='疯狗型'&&(playerNear||nearestSnake)){this.aiState='hunt';this.target=playerNear?P:nearestSnake;this.stateUntil=G.time+rnd(.7,1.25)}
  else if(this.style==='猎手型'&&nearestSnake&&Math.random()<.78){this.aiState='hunt';this.target=playerNear&&Math.random()<.45?P:nearestSnake;this.stateUntil=G.time+rnd(.65,1.2)}
  else if(this.style==='伏击型'&&nearestSnake&&Math.sqrt(sd)<720&&Math.random()<.68){this.aiState='hunt';this.target=nearestSnake;this.stateUntil=G.time+rnd(.75,1.35)}
  else if(nearestFood&&(this.style==='觅食型'||this.style==='谨慎型'||Math.random()<.68)){this.aiState='forage';this.target=nearestFood;this.stateUntil=G.time+rnd(.55,1.15)}
  else{this.aiState='wander';this.target={x:clamp(this.x+rnd(-850,850),120,G.WORLD.w-120),y:clamp(this.y+rnd(-850,850),120,G.WORLD.h-120)};this.stateUntil=G.time+rnd(.8,1.8)}
 }
 eatFood(){const R=this.radius+this.mag,foods=G.spatial?G.spatial.foodsNear(this.x,this.y,R+22):G.foods;for(const f of foods){if(f.dead)continue;let dx=this.x-f.x,dy=this.y-f.y,d=Math.hypot(dx,dy);if(d<R&&d>3){const q=(1-d/R)*.16;f.x+=dx*q;f.y+=dy*q}if(d<this.radius+f.r+3){f.dead=true;this.score+=f.v*this.feast;G.burst(f.x,f.y,f.c,4)}}if(this.orbiters)for(let k=0;k<this.orbiters;k++){const a=G.time*1.8+k*G.TAU/this.orbiters,ox=this.x+Math.cos(a)*(this.radius+28),oy=this.y+Math.sin(a)*(this.radius+28),near=G.spatial?G.spatial.foodsNear(ox,oy,22):G.foods;for(const f of near)if(!f.dead&&Math.hypot(f.x-ox,f.y-oy)<17){f.dead=true;this.score+=f.v*this.feast*.8}}}
 checkCollision(){const heads=G.spatial?G.spatial.headsNear(this.x,this.y,70):G.snakes;for(const other of heads){if(other===this||other.dead||other.inv>0)continue;const hd=Math.hypot(this.x-other.x,this.y-other.y);if(hd<(this.radius+other.radius)*.72){this.die(other);other.die(this);return}}const bodies=G.spatial?G.spatial.bodiesNear(this.x,this.y,72):null;if(bodies){for(const p of bodies){const other=p.owner;if(!other||other===this||other.dead||other.inv>0)continue;if(Math.hypot(this.x-p.x,this.y-p.y)<this.radius*.72+other.radius*.68){this.die(other);return}}}else for(const other of G.snakes){if(other===this||other.dead||other.inv>0)continue;for(let i=6;i<other.body.length;i+=2){const p=other.body[i];if(Math.hypot(this.x-p.x,this.y-p.y)<this.radius*.72+other.radius*.68){this.die(other);return}}}}
 die(killer){if(this.dead)return;this.dead=true;const step=Math.max(2,Math.ceil(this.body.length/120));for(let i=0;i<this.body.length;i+=step){const p=this.body[i];G.foods.push(new Food(p.x+rnd(-5,5),p.y+rnd(-5,5),rnd(3,8),this.palette[i%2]))}G.burst(this.x,this.y,this.palette[0],18);if(killer&&killer!==this){killer.kills++;killer.score+=20+(killer.killBonus||0);G.onKill?.(killer,this)}if(this===G.player)setTimeout(G.gameOver,360)}
}
G.Food=Food;G.Snake=Snake;
})();