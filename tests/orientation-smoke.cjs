const assert=require('node:assert');
let raw={windowWidth:390,windowHeight:844,pixelRatio:2},windowResize,orientationChange,requestedOrientation,touchStart;
const gradient={addColorStop(){}};
const ctx=new Proxy({measureText:t=>({width:String(t).length*7}),createRadialGradient:()=>gradient,setTransform(){},fillRect(){},beginPath(){},rect(){},fill(){},stroke(){},arc(){},ellipse(){},moveTo(){},lineTo(){},closePath(){},save(){},restore(){},translate(){},rotate(){},quadraticCurveTo(){},fillText(){},setLineDash(){}},{get(o,k){if(k in o)return o[k];return()=>{}},set(o,k,v){o[k]=v;return true}});
const canvas={width:0,height:0,getContext:()=>ctx,requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
global.wx={
  createCanvas:()=>canvas,
  getWindowInfo:()=>({...raw}),
  onWindowResize:fn=>windowResize=fn,
  onDeviceOrientationChange:fn=>orientationChange=fn,
  setDeviceOrientation:o=>{requestedOrientation=o.value},
  onTouchStart:fn=>touchStart=fn,onTouchMove(){},onTouchEnd(){},onTouchCancel(){},
  getStorageSync:()=>0,setStorageSync(){},setKeepScreenOn(){},vibrateShort(){}
};
const {boot}=require('../minigame/src/main');
const runtime=boot();
assert.equal(requestedOrientation,'landscape','runtime should request landscape orientation');
assert.equal(runtime.platform.portraitSource,true,'test must emulate stale portrait metrics from iOS');
assert.equal(runtime.platform.width,844,'portrait source width must normalize to landscape width');
assert.equal(runtime.platform.height,390,'portrait source height must normalize to landscape height');
assert.equal(canvas.width,1688,'backing canvas width must use normalized landscape width');
assert.equal(canvas.height,780,'backing canvas height must use normalized landscape height');
assert.equal(runtime.game.width,844,'game viewport must initialize with normalized landscape width');
assert.equal(runtime.game.height,390,'game viewport must initialize with normalized landscape height');
assert(runtime.renderer.hitboxes.start,'intro should render after landscape normalization');
const start=runtime.renderer.hitboxes.start;
assert(start.x>=0&&start.y>=0&&start.x+start.w<=844&&start.y+start.h<=390,'start button must remain inside landscape viewport');

raw={windowWidth:932,windowHeight:430,pixelRatio:3};
windowResize({size:{windowWidth:932,windowHeight:430,pixelRatio:3}});
assert.equal(runtime.platform.width,932);assert.equal(runtime.platform.height,430);
assert.equal(canvas.width,2796);assert.equal(canvas.height,1290);
assert.equal(runtime.game.width,932,'renderer resize must resync game width');
assert.equal(runtime.game.height,430,'renderer resize must resync game height');

raw={windowWidth:430,windowHeight:932,pixelRatio:3};
orientationChange({value:'landscape'});
runtime.platform.resize();
assert.equal(runtime.platform.width,932,'stale portrait metrics after orientation event must stay normalized');
assert.equal(runtime.platform.height,430,'stale portrait metrics after orientation event must stay normalized');
runtime.renderer.draw();
const release=runtime.renderer.hitboxes.release;
assert(release&&release.x>=0&&release.y>=0&&release.x+release.w<=932&&release.y+release.h<=430,'version badge must fit normalized landscape viewport');

// Smoke touch on the visible start control in normalized landscape coordinates.
touchStart({changedTouches:[{identifier:1,clientX:start.x+start.w/2,clientY:start.y+start.h/2}]});
assert.equal(runtime.game.state,'playing','normalized landscape touch coordinates must still start the game');
runtime.stop();
console.log('ORIENTATION PASS: stale 390x844 iOS metrics normalize to landscape, resize to 932x430, UI and touch remain usable.');
