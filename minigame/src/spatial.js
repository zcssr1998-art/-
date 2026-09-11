class SpatialGrid{
  constructor(cell=240){this.cell=cell;this.food=new Map();this.heads=new Map();this.body=new Map()}
  key(x,y){return `${Math.floor(x/this.cell)},${Math.floor(y/this.cell)}`}
  add(map,x,y,item){const k=this.key(x,y);let a=map.get(k);if(!a){a=[];map.set(k,a)}a.push(item)}
  rebuild(game){this.food.clear();this.heads.clear();this.body.clear();for(const f of game.foods)if(!f.dead)this.add(this.food,f.x,f.y,f);for(const s of game.snakes){if(s.dead)continue;this.add(this.heads,s.x,s.y,s);const stride=Math.max(3,Math.floor(s.body.length/90));for(let i=6;i<s.body.length;i+=stride){const p=s.body[i];this.add(this.body,p.x,p.y,{x:p.x,y:p.y,owner:s})}}}
  query(map,x,y,r){const c=this.cell,minX=Math.floor((x-r)/c),maxX=Math.floor((x+r)/c),minY=Math.floor((y-r)/c),maxY=Math.floor((y+r)/c),out=[];for(let gx=minX;gx<=maxX;gx++)for(let gy=minY;gy<=maxY;gy++){const a=map.get(`${gx},${gy}`);if(a)out.push(...a)}return out}
  foodsNear(x,y,r){return this.query(this.food,x,y,r)}
  headsNear(x,y,r){return this.query(this.heads,x,y,r)}
  bodiesNear(x,y,r){return this.query(this.body,x,y,r)}
}
module.exports={SpatialGrid};