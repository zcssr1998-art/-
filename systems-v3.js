(()=>{
const G=window.EVO,S=G.Snake.prototype,oldUpdate=S.update,oldEat=S.eatFood,oldDie=S.die;
S.update=function(dt){
 const baseBoost=this.boost,baseTurn=this.turn,baseMag=this.mag;
 if(this.chargeRate){if(!this.boosting)this.charge=Math.min(1,(this.charge||0)+this.chargeRate*dt);else if((this.charge||0)>0){this.boost=baseBoost*(1+(this.charge||0)*(this.chargePower||.45));this.charge=Math.max(0,(this.charge||0)-dt*.58)}}
 if(this.sizeTurn)this.turn=baseTurn*(1+Math.min(.42,Math.sqrt(Math.max(0,this.score))/120*this.sizeTurn*.18));
 if(this.tideMag){const wave=Math.pow((Math.sin(G.time*2.15+this.seed)+1)/2,3);this.mag=baseMag+this.tideMag*wave}
 oldUpdate.call(this,dt);
 this.boost=baseBoost;this.turn=baseTurn;this.mag=baseMag;
};
S.eatFood=function(){
 const before=this.score;oldEat.call(this);const gain=this.score-before;if(!(gain>0))return;
 this.foodHits=(this.foodHits||0)+1;
 if(this.comboWindow){const now=G.time;if(now-(this.lastFoodTime||-99)<=this.comboWindow)this.comboCount=(this.comboCount||0)+1;else this.comboCount=1;this.lastFoodTime=now;this.score+=gain*Math.min(.75,Math.max(0,this.comboCount-1)*(this.comboStep||.075))}
 if(this.boostFeast&&this.boosting)this.score+=gain*this.boostFeast;
 if(this.pulseEvery&&this.foodHits%this.pulseEvery===0){const R=this.pulseRadius||220,near=G.spatial?G.spatial.foodsNear(this.x,this.y,R):G.foods;let n=0;for(const f of near){if(f.dead||Math.hypot(f.x-this.x,f.y-this.y)>R)continue;f.dead=true;this.score+=f.v*this.feast*.62;G.burst?.(f.x,f.y,'#dffcff',1);if(++n>=36)break}G.burst?.(this.x,this.y,'#8af7ff',18)}
 if(this.splitEvery&&this.foodHits%this.splitEvery===0){for(let i=0;i<4;i++){const a=G.time+i*G.TAU/4,d=this.radius+55+i*7;G.foods.push(new G.Food(G.clamp(this.x+Math.cos(a)*d,30,G.WORLD.w-30),G.clamp(this.y+Math.sin(a)*d,30,G.WORLD.h-30),G.rnd(1.5,3.2),i%2?'#baff8b':'#8bffd7'))}}
};
S.die=function(killer){const wasDead=this.dead,victimScore=this.score;oldDie.call(this,killer);if(!wasDead&&killer&&killer!==this&&killer.corpseFeast){killer.score+=Math.min(140,Math.sqrt(Math.max(0,victimScore))*3.2)*killer.corpseFeast}}
})();