const assert=require('node:assert');
const {Game,Snake,Food}=require('../minigame/src/engine');
const {Renderer}=require('../minigame/src/render');
const {Input}=require('../minigame/src/input');
const {installAdvanced}=require('../minigame/src/advanced');
const {installGiant,sizeScale,bodyLimit}=require('../minigame/src/giant');
installAdvanced({Game,Snake,Food,Renderer,Input});
installGiant({Game,Snake,Food,Renderer,Input});

assert.equal(sizeScale(80),1);
assert(sizeScale(3400)>3,'late game body should be visibly larger');
assert(sizeScale(40000)>=9.9,'giant body scale should approach 10x');
assert(bodyLimit(40000)>1000,'giant snake should have a screen-spanning body length');

const g=new Game({width:844,height:390});g.start(0);g.player.inv=999;
const earlyRadius=g.player.radius;g.player.score=40000;const giantRadius=g.player.radius;
assert(giantRadius>earlyRadius*9,'physical collision radius must grow with visual size');
assert(g.player.maxBody>1000,'giant max body must exceed 1000 trail nodes');

const small=g.snakes.find(s=>s.ai);small.score=60;g.player.inv=0;small.inv=0;
g.player.x=5000;g.player.y=4000;small.x=5000+giantRadius*.65;small.y=4000;
g.player.body=[{x:g.player.x,y:g.player.y}];small.body=[{x:small.x,y:small.y}];
g.spatial.rebuild(g);g.player.checkCollision();
assert(g.player.dead&&small.dead,'dynamic broadphase must still detect giant head collisions');

const p2=new Game({width:844,height:390});p2.start(0);p2.player.score=40000;p2.player.inv=999;
const fakePlatform={width:844,height:390,ratio:1,ctx:{}};const r=new Renderer(fakePlatform,p2);r.camera.z=.38;
for(let i=0;i<40;i++)r.updateCamera();
assert(r.camera.z>.48,'camera should stop cancelling giant growth by excessive zoom-out');

console.log(`GIANT PASS: scale=${sizeScale(40000).toFixed(1)}x radius=${giantRadius.toFixed(1)} body=${bodyLimit(40000)} camera=${r.camera.z.toFixed(2)}`);
