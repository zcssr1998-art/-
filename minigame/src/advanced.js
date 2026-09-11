const {WORLD,TAU,clamp,rnd,pick}=require('./config');

const BRANCHES=[
  {id:'tide',name:'星潮灵体',role:'资源 / 成长',color:'#65f3ff',desc:'磁场与星潮共振。更擅长抢资源、连续成长，整条身体出现潮汐光纹。',apply:s=>{s.mag+=70;s.feast*=1.08;s.tideMag=(s.tideMag||0)+75}},
  {id:'dragon',name:'苍穹龙脉',role:'操控 / 追猎',color:'#ffe07a',desc:'强化大体型操控和击杀收益。身体形成龙脊光纹，但依旧撞到身体就死。',apply:s=>{s.turn*=1.12;s.sizeTurn=(s.sizeTurn||0)+.18;s.killBonus+=18}},
  {id:'comet',name:'彗火猎手',role:'机动 / 抢点',color:'#ff8b63',desc:'高速冲刺与低消耗路线。适合抢热点、切线反杀，身体形成彗火流线。',apply:s=>{s.speed*=1.07;s.boost*=1.12;s.boostCost*=.84}}
];

const SYNERGIES=[
  {id:'gravity-tide',name:'潮汐引力',needs:['magnet','tide'],color:'#62f5e6',apply:s=>{s.mag+=80;s.tideMag=(s.tideMag||0)+85}},
  {id:'thunder-comet',name:'雷火彗星',needs:['speed','comet','charge'],color:'#ffd45d',apply:s=>{s.speed*=1.05;s.boost*=1.10;s.boostCost*=.88}},
  {id:'glutton-engine',name:'暴食引擎',needs:['feast','combo','overload'],color:'#ff79b9',apply:s=>{s.feast*=1.12;s.comboStep=(s.comboStep||0)+.03;s.boostFeast=(s.boostFeast||0)+.12}},
  {id:'star-hatchery',name:'群星孵化',needs:['spore','split','core'],color:'#9cff9a',apply:s=>{s.orbiters++;s.pulseRadius=(s.pulseRadius||180)+120;s.splitEvery=Math.max(4,(s.splitEvery||8)-1)}},
  {id:'predator-echo',name:'掠食残响',needs:['kill','corpse'],color:'#d69bff',apply:s=>{s.killBonus+=25;s.corpseFeast=(s.corpseFeast||0)+.5}},
  {id:'cloud-rudder',name:'云龙舵',needs:['turn','rudder','moon'],color:'#bde7ff',apply:s=>{s.turn*=1.12;s.sizeTurn=(s.sizeTurn||0)+.2}}
];

const MUTATIONS=[
  {id:'magstorm',name:'磁暴腺体',color:'#63fff0',desc:'吸取范围再次扩大，并让资源流更集中。',apply:s=>{s.mag+=125;s.tideMag=(s.tideMag||0)+45}},
  {id:'hyperdrive',name:'超速腺体',color:'#ffe062',desc:'基础速度与冲刺速度同时上升。',apply:s=>{s.speed*=1.08;s.boost*=1.10}},
  {id:'devourer',name:'星胃扩张',color:'#ff89ba',desc:'所有星光成长收益再提高 18%。',apply:s=>s.feast*=1.18},
  {id:'hunter-eye',name:'猎杀星瞳',color:'#e8a0ff',desc:'诱导击杀奖励显著提高。',apply:s=>s.killBonus+=55},
  {id:'colony',name:'群星母巢',color:'#9dff9f',desc:'增加两颗采集伴星并强化分裂效率。',apply:s=>{s.orbiters+=2;s.splitEvery=Math.max(4,(s.splitEvery||8)-2)}},
  {id:'coreburst',name:'双核震荡',color:'#77e8ff',desc:'范围吸收脉冲更频繁、范围更大。',apply:s=>{s.pulseEvery=Math.max(4,(s.pulseEvery||10)-2);s.pulseRadius=(s.pulseRadius||180)+170}},
  {id:'gyro',name:'巨鳞陀螺',color:'#c8f3ff',desc:'后期大体型转向进一步补偿。',apply:s=>{s.turn*=1.10;s.sizeTurn=(s.sizeTurn||0)+.34}},
  {id:'afterburner',name:'永动彗尾',color:'#ff946d',desc:'冲刺消耗降低 35%，强化高速抢食。',apply:s=>{s.boostCost*=.65;s.boostFeast=(s.boostFeast||0)+.18}},
  {id:'crescent',name:'月潮复眼',color:'#b5c9ff',desc:'转向、冲刺和磁场获得小幅综合强化。',apply:s=>{s.turn*=1.08;s.boost*=1.07;s.mag+=45}}
];

const HOTSPOTS=[
  {id:'tide-sea',name:'星潮海',x:WORLD.w*.27,y:WORLD.h*.28,r:980,color:'#49dff5',target:58,mult:1.18,desc:'高密度资源区'},
  {id:'dragon-arena',name:'龙骨斗场',x:WORLD.w*.72,y:WORLD.h*.29,r:1050,color:'#f5c56b',target:42,mult:1.08,killMult:1.55,desc:'高冲突击杀区'},
  {id:'comet-rift',name:'彗火裂隙',x:WORLD.w*.31,y:WORLD.h*.73,r:1000,color:'#ff7862',target:52,mult:1.12,boostMult:1.18,desc:'高速抢食区'},
  {id:'prism-garden',name:'棱晶花园',x:WORLD.w*.75,y:WORLD.h*.72,r:930,color:'#bd87ff',target:50,mult:1.15,desc:'高价值星光区'}
];

function uniquePick(pool,n){const a=pool.slice(),out=[];while(out.length<n&&a.length){out.push(a.splice(Math.random()*a.length|0,1)[0])}return out}

function installAdvanced({Game,Snake,Food,Renderer,Input}){
  if(Game&&Snake&&!Game.prototype.__advancedGame){
    Game.prototype.__advancedGame=true;
    const oldStart=Game.prototype.start,oldUpdate=Game.prototype.update,oldChooseBuff=Game.prototype.chooseBuff,oldConsume=Snake.prototype.consume,oldDie=Snake.prototype.die,oldSense=Snake.prototype.sense;

    Game.prototype.start=function(...args){
      const r=oldStart.apply(this,args);this.branch=null;this.branchChoices=[];this.branchDone=false;this.synergies=[];this.mutations=[];this.mutationChoices=[];this.mutationMarks=[1850,3100];this.nextMutation=0;this.hotspots=HOTSPOTS.map(h=>({...h}));this.hotspotClock=0;this.activeHotspot=null;this.player.synergies=[];this.player.mutations=[];this.seedHotspots();return r
    };
    Game.prototype.hotspotAt=function(x,y){if(!this.hotspots)return null;for(const h of this.hotspots)if((x-h.x)**2+(y-h.y)**2<h.r*h.r)return h;return null};
    Game.prototype.seedHotspots=function(){if(!this.hotspots)return;for(const h of this.hotspots)for(let i=0;i<14;i++)this.spawnHotspotFood(h)};
    Game.prototype.spawnHotspotFood=function(h){const a=rnd(0,TAU),d=Math.sqrt(Math.random())*h.r*.88,x=clamp(h.x+Math.cos(a)*d,30,WORLD.w-30),y=clamp(h.y+Math.sin(a)*d,30,WORLD.h-30),f=new Food(x,y,rnd(4.5,10.5)*(h.id==='prism-garden'?1.18:1),h.color);f.hotspot=h.id;this.foods.push(f);return f};
    Game.prototype.maintainHotspots=function(){if(!this.hotspots||!this.spatial)return;for(const h of this.hotspots){const nearby=this.spatial.foodsNear(h.x,h.y,h.r),count=nearby.reduce((n,f)=>n+(!f.dead&&((f.x-h.x)**2+(f.y-h.y)**2<h.r*h.r)?1:0),0),need=Math.min(8,Math.max(0,h.target-count));for(let i=0;i<need;i++)this.spawnHotspotFood(h)}};
    Game.prototype.prepareBranch=function(){this.branchChoices=BRANCHES.slice();this.state='branch'};
    Game.prototype.chooseBranch=function(i){if(this.state!=='branch'||!this.branchChoices[i])return false;const b=this.branchChoices[i];b.apply(this.player);this.branch=b;this.player.branch=b;this.branchDone=true;this.branchChoices=[];this.state='playing';return true};
    Game.prototype.prepareMutation=function(){const owned=new Set(this.mutations.map(m=>m.id)),pool=MUTATIONS.filter(m=>!owned.has(m.id));this.mutationChoices=uniquePick(pool,3);if(this.mutationChoices.length)this.state='mutation'};
    Game.prototype.chooseMutation=function(i){if(this.state!=='mutation'||!this.mutationChoices[i])return false;const m=this.mutationChoices[i];m.apply(this.player);this.mutations.push(m);this.player.mutations=this.mutations.slice();this.mutationChoices=[];this.state='playing';return true};
    Game.prototype.resolveSynergies=function(){if(!this.player)return[];const ids=new Set(this.player.buffs.map(b=>b.id)),owned=new Set(this.synergies.map(s=>s.id)),gained=[];for(const s of SYNERGIES){if(owned.has(s.id)||!s.needs.every(id=>ids.has(id)))continue;s.apply(this.player);this.synergies.push(s);gained.push(s)}this.player.synergies=this.synergies.slice();return gained};

    Game.prototype.chooseBuff=function(i){const ok=oldChooseBuff.call(this,i);if(ok)this.resolveSynergies();return ok};
    Game.prototype.update=function(dt){
      if(this.state==='playing'&&this.player&&!this.player.dead)this.activeHotspot=this.hotspotAt(this.player.x,this.player.y);
      oldUpdate.call(this,dt);
      if(this.state!=='playing'||!this.player||this.player.dead)return;
      this.activeHotspot=this.hotspotAt(this.player.x,this.player.y);this.hotspotClock-=dt;if(this.hotspotClock<=0){this.hotspotClock=.7;this.maintainHotspots()}
      if(!this.branchDone&&this.player.score>=600){this.prepareBranch();return}
      if(this.nextMutation<this.mutationMarks.length&&this.player.score>=this.mutationMarks[this.nextMutation]){this.nextMutation++;this.prepareMutation()}
    };

    Snake.prototype.consume=function(f,factor=1,triggers=true){const h=this===this.game.player?this.game.activeHotspot:null;if(h){factor*=h.mult||1;if(h.boostMult&&this.boosting)factor*=h.boostMult}return oldConsume.call(this,f,factor,triggers)};
    Snake.prototype.die=function(killer){const g=this.game,h=killer===g.player?g.activeHotspot:null,before=killer&&!killer.dead?killer.score:0,wasDead=this.dead;const r=oldDie.call(this,killer);if(!wasDead&&this.dead&&h?.killMult&&killer===g.player&&!killer.dead){const earned=Math.max(0,killer.score-before);killer.score+=earned*(h.killMult-1)}return r};
    Snake.prototype.sense=function(){oldSense.call(this);if(!this.ai||this.dead||!this.game.hotspots)return;const g=this.game;if((this.hotspotThink||0)>g.time||this.nearCount>=6||this.aiState==='flee'||this.aiState==='unstuck'||this.nearestThreatD<180)return;if(Math.random()>.16)return;this.hotspotThink=g.time+rnd(5,9);let pool=g.hotspots;if(this.style==='疯狗型'||this.style==='猎手型')pool=pool.filter(h=>h.id==='dragon-arena'||h.id==='comet-rift');else if(this.style==='觅食型')pool=pool.filter(h=>h.id!=='dragon-arena');const h=pick(pool.length?pool:g.hotspots);this.aiState='forage';this.target={x:h.x+rnd(-h.r*.45,h.r*.45),y:h.y+rnd(-h.r*.45,h.r*.45)};this.stateUntil=g.time+rnd(2.5,4.5)};
  }

  if(Renderer&&!Renderer.prototype.__advancedRender){
    Renderer.prototype.__advancedRender=true;
    const oldBackground=Renderer.prototype.background,oldDrawSnake=Renderer.prototype.drawSnake,oldHud=Renderer.prototype.hud,oldDraw=Renderer.prototype.draw;
    Renderer.prototype.drawHotspots=function(){const X=this.ctx,z=this.camera.z;for(const h of this.g.hotspots||[]){const q=this.screen(h.x,h.y),r=h.r*z;if(q.x+r<0||q.x-r>this.p.width||q.y+r<0||q.y-r>this.p.height)continue;X.save();X.globalAlpha=.08;X.fillStyle=h.color;X.beginPath();X.arc(q.x,q.y,r,0,TAU);X.fill();X.globalAlpha=.22;X.strokeStyle=h.color;X.lineWidth=2;X.setLineDash&&X.setLineDash([10,12]);X.beginPath();X.arc(q.x,q.y,r*.96,0,TAU);X.stroke();X.setLineDash&&X.setLineDash([]);if(r>130){X.globalAlpha=.7;X.fillStyle=h.color;X.textAlign='center';X.font='bold 12px sans-serif';X.fillText(h.name,q.x,q.y-r*.72);X.font='9px sans-serif';X.fillText(h.desc,q.x,q.y-r*.72+15)}X.restore()}};
    Renderer.prototype.background=function(){oldBackground.call(this);this.drawHotspots()};
    Renderer.prototype.drawAdvancedFx=function(s){if(!s.body?.length)return;const X=this.ctx,z=this.camera.z,pts=[];for(let k=1;k<=7;k++){const p=s.body[Math.min(s.body.length-1,Math.floor(k*s.body.length/8))];if(p)pts.push(this.screen(p.x,p.y))}const r=Math.max(5,s.radius*z*.72),t=this.g.time;X.save();const branch=s.branch;if(branch){X.strokeStyle=branch.color;X.lineWidth=2;X.globalAlpha=.5;for(let i=0;i<pts.length;i++){const p=pts[i];X.beginPath();if(branch.id==='tide')X.arc(p.x,p.y,r*(1.25+.15*Math.sin(t*3+i)),0,TAU);else if(branch.id==='dragon'){X.moveTo(p.x-r*.7,p.y+r*.45);X.lineTo(p.x,p.y-r*(1.1+.08*i));X.lineTo(p.x+r*.7,p.y+r*.45)}else{X.moveTo(p.x-r*1.4,p.y+r*.5);X.lineTo(p.x+r*1.1,p.y-r*.5)}X.stroke()}}
      for(let j=0;j<(s.synergies||[]).length;j++){const sy=s.synergies[j],p=pts[(j*2+1)%Math.max(1,pts.length)];if(!p)continue;X.globalAlpha=.75;X.strokeStyle=sy.color;X.lineWidth=2;X.beginPath();X.arc(p.x,p.y,r*(1.45+.12*Math.sin(t*4+j)),t+j,t+j+Math.PI*1.35);X.stroke()}
      for(let j=0;j<(s.mutations||[]).length;j++){const m=s.mutations[j],p=pts[(j*3+2)%Math.max(1,pts.length)];if(!p)continue;X.globalAlpha=.65;X.fillStyle=m.color;for(let k=0;k<3;k++){const a=t*(1.2+j*.15)+k*TAU/3;X.beginPath();X.arc(p.x+Math.cos(a)*r*1.4,p.y+Math.sin(a)*r*1.4,Math.max(1.5,r*.14),0,TAU);X.fill()}}X.restore()};
    Renderer.prototype.drawSnake=function(s,player=false,crowd=0){oldDrawSnake.call(this,s,player,crowd);if(player&&!s.dead&&(s.branch||(s.synergies&&s.synergies.length)||(s.mutations&&s.mutations.length)))this.drawAdvancedFx(s)};
    Renderer.prototype.hud=function(){oldHud.call(this);const P=this.g.player;if(!P)return;const lines=[];if(this.g.branch)lines.push(`路线  ${this.g.branch.name}`);if(this.g.activeHotspot)lines.push(`区域  ${this.g.activeHotspot.name}`);if(this.g.synergies?.length)lines.push(`联动  ${this.g.synergies.slice(-2).map(s=>s.name).join(' / ')}`);if(this.g.mutations?.length)lines.push(`突变  ${this.g.mutations.map(m=>m.name).join(' / ')}`);if(!lines.length)return;const X=this.ctx,h=24+lines.length*15;this.panel(16,128,238,h,.54);X.textAlign='left';X.font='10px sans-serif';for(let i=0;i<lines.length;i++){X.fillStyle=i===0?'#dfffee':'#a9badd';X.fillText(lines[i],28,148+i*15)}};
    Renderer.prototype.choiceOverlay=function(title,sub,choices,key){const X=this.ctx,w=this.p.width,h=this.p.height;X.fillStyle='rgba(3,7,20,.82)';X.fillRect(0,0,w,h);X.textAlign='center';X.fillStyle='#fff';X.font='bold 22px sans-serif';X.fillText(title,w/2,40);X.fillStyle='#8ea7d3';X.font='10px sans-serif';X.fillText(sub,w/2,58);const gap=14,cw=Math.min(250,(w-56-gap*2)/3),ch=Math.min(235,h-84),sx=(w-(cw*3+gap*2))/2,y=70;this.hitboxes[key]=[];for(let i=0;i<3;i++){const b=choices[i];if(!b)continue;const x=sx+i*(cw+gap);this.hitboxes[key].push({x,y,w:cw,h:ch});this.panel(x,y,cw,ch,.94);X.fillStyle=b.color||'#73e9d2';X.fillRect(x,y,4,ch);X.fillStyle=b.color||'#73e9d2';X.font='bold 11px sans-serif';X.fillText(b.role||'稀有突变',x+cw/2,y+28);X.fillStyle='#fff';X.font='bold 18px sans-serif';X.fillText(b.name,x+cw/2,y+58);X.fillStyle='#9eafd1';X.font='11px sans-serif';this.wrap(b.desc,x+18,y+88,cw-36,17)}};
    Renderer.prototype.draw=function(){oldDraw.call(this);if(this.g.state==='branch')this.choiceOverlay('选择进化路线','路线会改变整局 Build 倾向，但不会改变碰撞死亡规则。',this.g.branchChoices,'branch');else if(this.g.state==='mutation')this.choiceOverlay('发生稀有突变','从三个强力变异中选择一个，本局永久生效。',this.g.mutationChoices,'mutation')};
  }

  if(Input&&!Input.prototype.__advancedInput){
    Input.prototype.__advancedInput=true;const oldUiTap=Input.prototype.uiTap;
    Input.prototype.uiTap=function(p){const h=this.r.hitboxes,state=this.g.state;if(state==='branch'){for(let i=0;i<(h.branch||[]).length;i++)if(this.inside(p,h.branch[i])){const ok=this.g.chooseBranch(i);if(ok)this.p.vibrate();return ok}}if(state==='mutation'){for(let i=0;i<(h.mutation||[]).length;i++)if(this.inside(p,h.mutation[i])){const ok=this.g.chooseMutation(i);if(ok)this.p.vibrate();return ok}}return oldUiTap.call(this,p)};
  }
}

module.exports={installAdvanced,BRANCHES,SYNERGIES,MUTATIONS,HOTSPOTS};
