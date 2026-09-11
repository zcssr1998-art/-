(()=>{
const G=window.EVO;
class SpatialGrid{
  constructor(cell=240){this.cell=cell;this.food=new Map();this.heads=new Map();this.body=new Map()}
  clear(){this.food.clear();this.heads.clear();this.body.clear()}
  key(x,y){return ((x/this.cell)|0)+','+((y/this.cell)|0)}
  add(map,x,y,value){const k=this.key(x,y);let a=map.get(k);if(!a)map.set(k,a=[]);a.push(value)}
  query(map,x,y,r){const out=[],c=this.cell,minX=Math.floor((x-r)/c),maxX=Math.floor((x+r)/c),minY=Math.floor((y-r)/c),maxY=Math.floor((y+r)/c);for(let gx=minX;gx<=maxX;gx++)for(let gy=minY;gy<=maxY;gy++){const a=map.get(gx+','+gy);if(a)for(let i=0;i<a.length;i++)out.push(a[i])}return out}
  rebuild(){
    this.clear();
    for(const f of G.foods)if(!f.dead)this.add(this.food,f.x,f.y,f);
    for(const s of G.snakes){
      if(s.dead)continue;this.add(this.heads,s.x,s.y,s);
      for(let i=6;i<s.body.length;i+=3){const p=s.body[i];p.owner=s;this.add(this.body,p.x,p.y,p)}
    }
  }
  foodsNear(x,y,r){return this.query(this.food,x,y,r)}
  headsNear(x,y,r){return this.query(this.heads,x,y,r)}
  bodiesNear(x,y,r){return this.query(this.body,x,y,r)}
}
G.SpatialGrid=SpatialGrid;
})();