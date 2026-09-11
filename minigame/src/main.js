const {createPlatform}=require('./platform');
const {Game}=require('./engine');
const {Renderer}=require('./render');
const {Input}=require('./input');
const {SIM}=require('./config');
function boot(){
  const platform=createPlatform();platform.setKeepScreenOn();const best=Number(platform.getStorage('evo_best',0))||0,game=new Game({width:platform.width,height:platform.height,best}),renderer=new Renderer(platform,game),input=new Input(platform,game,renderer);renderer.setInput(input);let last=platform.now(),acc=0,lastState=game.state,frameId=null;
  function frame(){const now=platform.now(),dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;acc+=dt;input.apply();let steps=0;while(acc>=SIM.fixedStep&&steps<4){game.update(SIM.fixedStep);acc-=SIM.fixedStep;steps++}if(steps===4&&acc>SIM.fixedStep*4)acc=0;if(lastState!=='gameover'&&game.state==='gameover')platform.setStorage('evo_best',game.best);lastState=game.state;renderer.draw();frameId=platform.raf(frame)}
  renderer.draw();frameId=platform.raf(frame);const runtime={platform,game,renderer,input,stop:()=>platform.caf(frameId)};if(typeof GameGlobal!=='undefined')GameGlobal.EvoSnake=runtime;return runtime
}
module.exports={boot};