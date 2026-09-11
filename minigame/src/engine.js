const C=require('./config');
const {SpatialGrid}=require('./spatial');
const {WORLD,SIM,NAMES,STAGES,UPGRADE_MARKS,BOT_STYLES,SKINS,BUFFS,TAU,clamp,rnd,pick,angleDiff,stageFor}=C;
class Food{
  constructor(x=rnd(40,WORLD.w-40),y=rnd(40,WORLD.h-40),v=rnd(2,7),c=pick(['#86ffe1','#72e9ff','#ffdf7a','#ff91c8','#c39bff','#baff7f'])){Object.assign(this,{x,y,v,c,r:3+Math.sqrt(v),dead:false})}
}
class Snake{
  constructor(game,{ai=false,name='小团子',score=80,x=rnd(300,WORLD.w-300),y=rnd(300,WORLD.h-300),skin=SKINS[0],style=pick(BOT_STYLES)}={}){
    this.game=game;Object.assign(this,{ai,name,score,x,y,skin,palette:skin.palette,style,a:rnd(0,TAU),ta:0,dead:false,body:[],mag:28,speed:1,boost:1,turn:1,feast:1,orbiters:0,boostCost:1,buffs:[],inv:.8,think:0,target:null,boosting:false,kills:0,trail:0,fins:0,killBonus:0,aiState:'wander',stateUntil:0,stuckClock:0,stuckX:x,stuckY:y,stuckLevel:0,escapeA:0,simAccum:0,seed:Math.random()*99,senseClock:0,eatClock:0,collisionClock:0,steerX:0,steerY:0,nearCount:0,nearestThreatD:1e9,nearestThreat:null,comboCount:0,lastEatAt:-99,foodEaten:0,charge:0});
    this.ta=this.a;this.escapeA=this.a;for(let i=0;i<36;i++)this.body.push({x:x-i*5.2,y});
  }
  get stage(){return stageFor(this.score)}
  get stageIndex(){return STAGES.indexOf(this.stage)}
  get radius(){return this.stage[2]}
  get maxBody(){return 30+Math.floor(Math.sqrt(this.score)*2.55)}
  update(dt){
    if(this.dead)return;this.inv=Math.max(0,this.inv-dt);if(this.ai)this.brain(dt);
    const sizePenalty=1+Math.min(.28,Math.sqrt(this.score)/155),sizeAid=1+(this.sizeTurn||0)*Math.min(.45,Math.sqrt(this.score)/95),turnRate=5.9*this.turn/sizePenalty*sizeAid;
    this.a+=clamp(angleDiff(this.a,this.ta),-turnRate*dt,turnRate*dt);
    const boosting=this.boosting&&this.score>55;let chargeBoost=1;
    if(this.chargeRate){if(boosting){chargeBoost+=this.charge*(this.chargePower||0);this.charge=Math.max(0,this.charge-dt*1.45)}else this.charge=Math.min(1,this.charge+dt*this.chargeRate)}
    const cruise=(138+Math.min(34,Math.sqrt(this.score)*.72))*this.speed,v=cruise*(boosting?1.72*this.boost*chargeBoost:1);
    this.x+=Math.cos(this.a)*v*dt;this.y+=Math.sin(this.a)*v*dt;
    if(this.x<70||this.x>WORLD.w-70||this.y<70||this.y>WORLD.h-70)this.ta=Math.atan2(WORLD.h/2-this.y,WORLD.w/2-this.x);
    this.x=clamp(this.x,10,WORLD.w-10);this.y=clamp(this.y,10,WORLD.h-10);
    const h=this.body[0];if(!h||Math.hypot(this.x-h.x,this.y-h.y)>4.4)this.body.unshift({x:this.x,y:this.y});while(this.body.length>this.maxBody)this.body.pop();
    if(boosting)this.score=Math.max(50,this.score-dt*7.5*this.boostCost);
    this.eatClock-=dt;if(!this.ai||this.eatClock<=0){this.eatClock=this.ai?.05:0;this.eatFood()}
    this.collisionClock-=dt;if(this.inv<=0&&(!this.ai||this.collisionClock<=0)){this.collisionClock=this.ai?.034:0;this.checkCollision()}
  }
  brain(dt){
    const g=this.game;this.stuckClock+=dt;this.think-=dt;this.senseClock-=dt;
    if(this.stuckClock>=.78){const moved=Math.hypot(this.x-this.stuckX,this.y-this.stuckY);this.stuckLevel=moved<48?this.stuckLevel+1:Math.max(0,this.stuckLevel-1);this.stuckX=this.x;this.stuckY=this.y;this.stuckClock=0;if(this.stuckLevel>=2){this.aiState='unstuck';this.stateUntil=g.time+1.15;this.escapeA=this.a+(Math.random()<.5?-1:1)*rnd(.85,1.55);this.stuckLevel=0}}
    if(this.senseClock<=0)this.sense();let tx=this.target?.x??WORLD.w/2,ty=this.target?.y??WORLD.h/2;
    if(this.aiState==='unstuck'){tx=this.x+Math.cos(this.escapeA)*420;ty=this.y+Math.sin(this.escapeA)*420;this.boosting=true}
    else if(this.aiState==='flee'){const t=this.target;if(t){tx=this.x+(this.x-t.x)*2.2;ty=this.y+(this.y-t.y)*2.2}else{tx=this.x+this.steerX;ty=this.y+this.steerY}this.boosting=this.nearestThreatD<185}
    else if(this.aiState==='hunt'&&this.target instanceof Snake){const t=this.target,lead=this.style==='伏击型'?245:155,side=this.style==='疯狗型'?0:Math.sin(this.seed)*72;tx=t.x+Math.cos(t.a)*lead+Math.cos(t.a+Math.PI/2)*side;ty=t.y+Math.sin(t.a)*lead+Math.sin(t.a+Math.PI/2)*side;const d=Math.hypot(t.x-this.x,t.y-this.y);this.boosting=d>210&&d<720}
    else this.boosting=false;
    const crowd=this.nearCount>=7?1.9:1,dx=tx-this.x+this.steerX*crowd,dy=ty-this.y+this.steerY*crowd;if(this.nearCount>=7)this.boosting=false;if(Math.abs(dx)+Math.abs(dy)>1)this.ta=Math.atan2(dy,dx)+Math.sin(g.time*1.7+this.seed)*.018;
  }
  sense(){
    const g=this.game,grid=g.spatial,P=g.player,distP=P&&!P.dead?Math.hypot(this.x-P.x,this.y-P.y):0;this.senseClock=distP<SIM.near?rnd(.075,.105):distP<SIM.mid?rnd(.14,.21):rnd(.32,.48);
    const heads=grid.headsNear(this.x,this.y,620),body=grid.bodiesNear(this.x,this.y,175);let sepX=0,sepY=0,avoidX=0,avoidY=0,nearestThreat=null,nearestThreatD=1e9,nearCount=0;
    for(const o of heads){if(o===this||o.dead)continue;const dx=this.x-o.x,dy=this.y-o.y,d=Math.hypot(dx,dy)||1;if(d<190)nearCount++;if(d<115){const q=(115-d)/115;sepX+=dx/d*q*140;sepY+=dy/d*q*140}const toward=Math.abs(angleDiff(o.a,Math.atan2(this.y-o.y,this.x-o.x)))<.72;if((toward&&d<270)||d<105){if(d<nearestThreatD){nearestThreat=o;nearestThreatD=d}}}
    for(const p of body){const owner=p.owner;if(!owner||owner===this||owner.dead)continue;const dx=this.x-p.x,dy=this.y-p.y,d=Math.hypot(dx,dy)||1;if(d<150){const q=(150-d)/150;avoidX+=dx/d*q*260;avoidY+=dy/d*q*260}}
    this.steerX=sepX+avoidX;this.steerY=sepY+avoidY;this.nearCount=nearCount;this.nearestThreat=nearestThreat;this.nearestThreatD=nearestThreatD;
    if(this.think>0&&g.time<this.stateUntil&&!this.target?.dead)return;this.think=distP>SIM.mid?rnd(.65,1.25):rnd(.18,.42);
    const foods=grid.foodsNear(this.x,this.y,620);let nearestFood=null,fd=1e9;for(const f of foods){if(f.dead)continue;const d=(f.x-this.x)**2+(f.y-this.y)**2;if(d<fd){fd=d;nearestFood=f}}
    let nearestSnake=null,sd=1e9;for(const o of heads){if(o===this||o.dead||o.inv>0)continue;const d=(o.x-this.x)**2+(o.y-this.y)**2;if(d<sd){sd=d;nearestSnake=o}}
    const playerNear=P&&!P.dead&&P.inv<=0&&distP<1150;
    if(this.stuckLevel>=2){this.aiState='unstuck';this.escapeA=this.a+(Math.random()<.5?-1:1)*rnd(.9,1.6);this.stateUntil=g.time+1.1}
    else if(nearCount>=7||nearestThreatD<120){this.aiState='flee';this.target=nearestThreat;this.stateUntil=g.time+rnd(.45,.85)}
    else if(this.style==='谨慎型'&&nearestSnake&&Math.sqrt(sd)<360){this.aiState='flee';this.target=nearestSnake;this.stateUntil=g.time+rnd(.55,1)}
    else if(this.style==='疯狗型'&&(playerNear||nearestSnake)){this.aiState='hunt';this.target=playerNear?P:nearestSnake;this.stateUntil=g.time+rnd(.7,1.25)}
    else if(this.style==='猎手型'&&nearestSnake&&Math.random()<.78){this.aiState='hunt';this.target=playerNear&&Math.random()<.45?P:nearestSnake;this.stateUntil=g.time+rnd(.65,1.2)}
    else if(this.style==='伏击型'&&nearestSnake&&Math.sqrt(sd)<720&&Math.random()<.68){this.aiState='hunt';this.target=nearestSnake;this.stateUntil=g.time+rnd(.75,1.35)}
    else if(nearestFood&&(this.style==='觅食型'||this.style==='谨慎型'||Math.random()<.68)){this.aiState='forage';this.target=nearestFood;this.stateUntil=g.time+rnd(.55,1.15)}
    else{this.aiState='wander';this.target={x:clamp(this.x+rnd(-850,850),120,WORLD.w-120),y:clamp(this.y+rnd(-850,850),120,WORLD.h-120)};this.stateUntil=g.time+rnd(.8,1.8)}
  }
  eatFood(){
    const g=this.game,tide=this.tideMag?this.tideMag*(.3+.7*(.5+.5*Math.sin(g.time*1.7))):0,R=this.radius+this.mag+tide,foods=g.spatial.foodsNear(this.x,this.y,R+28);
    for(const f of foods){if(f.dead)continue;let dx=this.x-f.x,dy=this.y-f.y,d=Math.hypot(dx,dy);if(d<R&&d>3){const q=(1-d/R)*.16;f.x+=dx*q;f.y+=dy*q;d=Math.hypot(this.x-f.x,this.y-f.y)}if(d<this.radius+f.r+3)this.consume(f,1,true)}
    if(this.orbiters)for(let k=0;k<this.orbiters;k++){const a=g.time*1.8+k*TAU/this.orbiters,ox=this.x+Math.cos(a)*(this.radius+28),oy=this.y+Math.sin(a)*(this.radius+28),near=g.spatial.foodsNear(ox,oy,26);for(const f of near)if(!f.dead&&Math.hypot(f.x-ox,f.y-oy)<18)this.consume(f,.8,true)}
  }
  consume(f,factor=1,triggers=true){
    if(f.dead)return;const g=this.game;f.dead=true;let mult=this.feast*factor;
    if(this.comboWindow){if(g.time-this.lastEatAt<=this.comboWindow)this.comboCount++;else this.comboCount=0;mult*=1+Math.min(.75,this.comboCount*(this.comboStep||0))}
    if(this.boosting&&this.boostFeast)mult*=1+this.boostFeast;this.lastEatAt=g.time;this.score+=f.v*mult;this.foodEaten++;g.burst(f.x,f.y,f.c,2);
    if(!triggers)return;
    if(this.pulseEvery&&this.foodEaten%this.pulseEvery===0){for(const q of g.spatial.foodsNear(this.x,this.y,this.pulseRadius||180))if(!q.dead&&Math.hypot(q.x-this.x,q.y-this.y)<(this.pulseRadius||180))this.consume(q,.55,false);g.burst(this.x,this.y,'#8ff8ff',18)}
    if(this.splitEvery&&this.foodEaten%this.splitEvery===0){const base=this.body[Math.min(this.body.length-1,20)]||this;for(let i=0;i<4;i++){const a=rnd(0,TAU),d=rnd(65,130);g.foods.push(new Food(clamp(base.x+Math.cos(a)*d,20,WORLD.w-20),clamp(base.y+Math.sin(a)*d,20,WORLD.h-20),rnd(1.2,2.4),'#9cffb1'))}}
  }
  checkCollision(){
    const g=this.game,heads=g.spatial.headsNear(this.x,this.y,75);for(const other of heads){if(other===this||other.dead||other.inv>0)continue;const hd=Math.hypot(this.x-other.x,this.y-other.y);if(hd<(this.radius+other.radius)*.72){this.die(other);other.die(this);return}}
    for(const p of g.spatial.bodiesNear(this.x,this.y,78)){const other=p.owner;if(!other||other===this||other.dead||other.inv>0)continue;if(Math.hypot(this.x-p.x,this.y-p.y)<this.radius*.72+other.radius*.68){this.die(other);return}}
  }
  die(killer){
    if(this.dead)return;const g=this.game;this.dead=true;const step=Math.max(2,Math.ceil(this.body.length/120));for(let i=0;i<this.body.length;i+=step){const p=this.body[i];g.foods.push(new Food(p.x+rnd(-5,5),p.y+rnd(-5,5),rnd(3,8),this.palette[i%2]))}g.burst(this.x,this.y,this.palette[0],18);
    if(killer&&killer!==this&&!killer.dead){killer.kills++;let bonus=20+(killer.killBonus||0);if(killer.corpseFeast)bonus+=Math.sqrt(this.score)*killer.corpseFeast*.35;killer.score+=bonus}
    if(this===g.player)g.finish();
  }
}
class Game{
  constructor(opts={}){this.width=opts.width||1280;this.height=opts.height||720;this.spatial=new SpatialGrid(SIM.cell);this.state='intro';this.skinIndex=0;this.best=opts.best||0;this.time=0;this.foods=[];this.snakes=[];this.particles=[];this.player=null;this.nextUpgrade=0;this.choices=[];this.spatialClock=0;this.cleanupClock=0}
  setViewport(w,h){this.width=w;this.height=h}
  pointAround(x,y,min=100,max=1300){const a=rnd(0,TAU),d=Math.sqrt(rnd(min*min,max*max));return{x:clamp(x+Math.cos(a)*d,80,WORLD.w-80),y:clamp(y+Math.sin(a)*d,80,WORLD.h-80)}}
  spawnFood(n=1,localBias=true){const alive=this.snakes.filter(s=>!s.dead);for(let i=0;i<n;i++){let x,y;if(localBias&&alive.length&&Math.random()<.9){const a=pick(alive),p=this.pointAround(a.x,a.y,35,1250);x=p.x;y=p.y}else{x=rnd(60,WORLD.w-60);y=rnd(60,WORLD.h-60)}this.foods.push(new Food(x,y))}}
  spawnBot(){const anchor=this.player&&!this.player.dead?this.player:{x:WORLD.w/2,y:WORLD.h/2},p=this.pointAround(anchor.x,anchor.y,850,3150),skin=pick(SKINS),s=new Snake(this,{ai:true,name:pick(NAMES),score:rnd(60,1250),x:p.x,y:p.y,skin,style:pick(BOT_STYLES)});this.snakes.push(s);return s}
  start(skinIndex=this.skinIndex){this.skinIndex=(skinIndex+SKINS.length)%SKINS.length;this.time=0;this.foods=[];this.snakes=[];this.particles=[];this.nextUpgrade=0;this.choices=[];const skin=SKINS[this.skinIndex];this.player=new Snake(this,{name:'小团子',score:80,x:WORLD.w/2,y:WORLD.h/2,skin});this.snakes.push(this.player);for(let i=0;i<SIM.bots;i++)this.spawnBot();this.spawnFood(SIM.foods);this.spatial.rebuild(this);this.state='playing';this.spatialClock=0;this.cleanupClock=0}
  cycleSkin(d){if(this.state!=='intro'&&this.state!=='gameover')return;this.skinIndex=(this.skinIndex+d+SKINS.length)%SKINS.length}
  randomSkin(){this.skinIndex=Math.random()*SKINS.length|0}
  prepareUpgrade(){this.choices=[];while(this.choices.length<3){const b=pick(BUFFS);if(!this.choices.includes(b))this.choices.push(b)}this.state='upgrade'}
  chooseBuff(i){if(this.state!=='upgrade'||!this.choices[i])return false;const b=this.choices[i];b.apply(this.player);this.player.buffs.push(b);this.choices=[];this.state='playing';return true}
  finish(){this.state='gameover';if(this.player){this.best=Math.max(this.best,Math.floor(this.player.score))}}
  burst(x,y,c,n=6){n=Math.min(n,Math.max(0,260-this.particles.length));for(let i=0;i<n;i++)this.particles.push({x,y,vx:rnd(-70,70),vy:rnd(-70,70),life:rnd(.3,.75),c,r:rnd(1,4)})}
  ensureLocalFood(){if(!this.player||this.player.dead)return;const near=this.spatial.foodsNear(this.player.x,this.player.y,SIM.localFoodRadius).filter(f=>!f.dead&&Math.hypot(f.x-this.player.x,f.y-this.player.y)<SIM.localFoodRadius);const need=Math.max(0,SIM.localFoodMin-near.length);for(let i=0;i<Math.min(need,24);i++){const p=this.pointAround(this.player.x,this.player.y,90,SIM.localFoodRadius*.9);this.foods.push(new Food(p.x,p.y))}}
  update(dt){
    if(this.state!=='playing')return;this.time+=dt;const P=this.player;if(!P||P.dead)return;
    this.spatialClock-=dt;if(this.spatialClock<=0){this.spatialClock=1/24;this.spatial.rebuild(this)}
    P.update(dt);for(const s of this.snakes){if(s===P||s.dead)continue;const d2=(s.x-P.x)**2+(s.y-P.y)**2,interval=d2<SIM.near**2?1/30:d2<SIM.mid**2?1/20:1/8;s.simAccum+=dt;if(s.simAccum>=interval){const step=Math.min(.125,s.simAccum);s.simAccum=0;s.update(step)}}
    this.cleanupClock+=dt;if(this.cleanupClock>=.12){this.cleanupClock=0;this.foods=this.foods.filter(f=>!f.dead);this.snakes=this.snakes.filter(s=>!s.dead||s===P);const missing=SIM.foods-this.foods.length;if(missing>0)this.spawnFood(Math.min(24,missing));let bots=0;for(const s of this.snakes)if(s.ai&&!s.dead)bots++;for(let i=0;i<Math.min(2,SIM.bots-bots);i++)this.spawnBot();this.ensureLocalFood()}
    if(this.state==='playing'&&this.nextUpgrade<UPGRADE_MARKS.length&&P.score>=UPGRADE_MARKS[this.nextUpgrade]){this.nextUpgrade++;this.prepareUpgrade()}
    for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}this.particles=this.particles.filter(p=>p.life>0)
  }
}
module.exports={Game,Snake,Food};