const {clamp}=require('./config');

function sizeScale(score){
  const mass=Math.max(0,(score||0)-80);
  return clamp(1+Math.pow(mass/1800,.6)*1.6,1,10);
}

function bodyLimit(score){
  const s=Math.max(0,score||0);
  const base=30+Math.sqrt(s)*2.55;
  const extra=Math.pow(Math.max(0,s-600),.62)*.85;
  return Math.min(1400,Math.round(base+extra));
}

function installGiant({Snake,Renderer}){
  if(!Snake||!Renderer||Snake.prototype.__giantInstalled)return;
  Snake.prototype.__giantInstalled=true;

  Object.defineProperty(Snake.prototype,'sizeScale',{configurable:true,get(){return sizeScale(this.score)}});
  Object.defineProperty(Snake.prototype,'radius',{configurable:true,get(){return this.stage[2]*this.sizeScale}});
  Object.defineProperty(Snake.prototype,'maxBody',{configurable:true,get(){return bodyLimit(this.score)}});

  const oldSense=Snake.prototype.sense;
  Snake.prototype.sense=function(){
    oldSense.call(this);
    const g=this.game;if(!g?.spatial)return;
    const range=Math.max(210,this.radius*2.5+95),heads=g.spatial.headsNear(this.x,this.y,range);
    let sx=0,sy=0;
    for(const o of heads){
      if(o===this||o.dead)continue;
      const dx=this.x-o.x,dy=this.y-o.y,d=Math.hypot(dx,dy)||1;
      const safe=this.radius+o.radius+32;
      if(d<safe*1.55){const q=(safe*1.55-d)/(safe*1.55);sx+=dx/d*q*(150+safe*.75);sy+=dy/d*q*(150+safe*.75)}
    }
    const bodies=g.spatial.bodiesNear(this.x,this.y,Math.max(180,this.radius+210));
    for(const p of bodies){
      const o=p.owner;if(!o||o===this||o.dead)continue;
      const dx=this.x-p.x,dy=this.y-p.y,d=Math.hypot(dx,dy)||1,safe=this.radius*.72+o.radius*.68+26;
      if(d<safe*1.5){const q=(safe*1.5-d)/(safe*1.5);sx+=dx/d*q*(180+safe);sy+=dy/d*q*(180+safe)}
    }
    this.steerX+=sx;this.steerY+=sy;
  };

  Snake.prototype.checkCollision=function(){
    const g=this.game;if(!g?.spatial)return;
    const headSearch=Math.max(120,this.radius+235),heads=g.spatial.headsNear(this.x,this.y,headSearch);
    for(const other of heads){
      if(other===this||other.dead||other.inv>0)continue;
      const hd=Math.hypot(this.x-other.x,this.y-other.y);
      if(hd<(this.radius+other.radius)*.72){this.die(other);other.die(this);return}
    }
    const bodySearch=Math.max(145,this.radius*.82+235);
    for(const p of g.spatial.bodiesNear(this.x,this.y,bodySearch)){
      const other=p.owner;if(!other||other===this||other.dead||other.inv>0)continue;
      if(Math.hypot(this.x-p.x,this.y-p.y)<this.radius*.72+other.radius*.68){this.die(other);return}
    }
  };

  Renderer.prototype.updateCamera=function(){
    const P=this.g.player;if(!P||P.dead)return;
    const normal=clamp((this.p.height/900)*(1-Math.min(.18,Math.sqrt(P.score)/3000)),.38,.88);
    const giantT=clamp((P.score-5000)/30000,0,1);
    const targetZ=clamp(normal*(1+giantT*.45),.38,.82);
    this.camera.x+=(P.x-this.camera.x)*.16;
    this.camera.y+=(P.y-this.camera.y)*.16;
    this.camera.z+=(targetZ-this.camera.z)*.12;
    if(!Number.isFinite(this.camera.x)||!Number.isFinite(this.camera.y)||!Number.isFinite(this.camera.z)||Math.hypot(this.camera.x-P.x,this.camera.y-P.y)>2200){this.camera.x=P.x;this.camera.y=P.y;this.camera.z=targetZ}
  };

  const oldHud=Renderer.prototype.hud;
  Renderer.prototype.hud=function(){
    oldHud.call(this);
    const P=this.g.player;if(!P)return;
    const X=this.ctx,scale=P.sizeScale;
    if(scale<=1.08)return;
    X.save();X.textAlign='left';X.font='bold 10px sans-serif';X.fillStyle=scale>=7?'#ffd36f':scale>=4?'#ff9e82':'#7ff3e4';
    X.fillText(`体型 ×${scale.toFixed(1)}`,30,118);X.restore();
  };
}

module.exports={installGiant,sizeScale,bodyLimit};
