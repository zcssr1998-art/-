import { chromium } from 'playwright-core';
import fs from 'node:fs';

const candidates=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=candidates.find(p=>fs.existsSync(p));
if(!executablePath) throw new Error('No Chromium/Chrome executable found on runner');

const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
const failures=[];
const assert=(cond,msg)=>{if(!cond)failures.push(msg)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const usefulError=s=>!String(s).includes('favicon.ico');

async function desktop(){
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&usefulError(m.text()))errors.push(m.text())});
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
 await page.click('#startBtn');
 await page.evaluate(()=>{EVO.player.inv=999;EVO.player.score=80;EVO.player.x=1500;EVO.player.y=1050;EVO.player.a=0;EVO.player.ta=0;});
 await sleep(120);
 assert(await page.locator('#intro').evaluate(e=>e.classList.contains('hidden')),'Desktop: start button did not enter game');

 const p0=await page.evaluate(()=>({x:EVO.player.x,y:EVO.player.y,a:EVO.player.a}));
 await page.keyboard.down('w');await sleep(520);
 const w=await page.evaluate(()=>({x:EVO.player.x,y:EVO.player.y,input:{...EVO.input},mode:document.querySelector('#inputMode')?.textContent,a:EVO.player.a}));
 await page.keyboard.up('w');
 assert(w.mode==='WASD','Desktop: WASD mode did not activate');
 assert(w.input.y < -0.9,'Desktop: W did not set upward input');
 assert(w.y < p0.y-25,'Desktop: W steering is still too sluggish');

 await page.mouse.move(1100,360);await sleep(180);
 const mouse=await page.evaluate(()=>({input:{...EVO.input},mode:document.querySelector('#inputMode')?.textContent}));
 assert(mouse.mode==='鼠标跟随','Desktop: mouse mode did not reactivate');
 assert(mouse.input.x>0.9 && Math.abs(mouse.input.y)<0.2,'Desktop: mouse-follow vector is wrong');

 await page.evaluate(()=>{EVO.player.inv=999;EVO.player.score=80;EVO.player.a=0;EVO.player.ta=0;EVO.input.x=1;EVO.input.y=0;EVO.player.x=1500;EVO.player.y=1050;});
 await sleep(60);
 const b0=await page.evaluate(()=>({x:EVO.player.x,score:EVO.player.score}));
 await page.keyboard.down('Space');await sleep(260);
 const b1=await page.evaluate(()=>({x:EVO.player.x,boost:EVO.input.boost,boosting:EVO.player.boosting,score:EVO.player.score}));
 await page.keyboard.up('Space');
 assert(b1.boost===true && b1.boosting===true,'Desktop: Space boost did not engage');
 assert(b1.x-b0.x>50,'Desktop: boost speed increase is too weak or not applied');
 assert(b1.score<b0.score,'Desktop: boost did not consume length');
 assert(errors.length===0,'Desktop browser errors: '+errors.join(' | '));
 await page.close();
}

async function mobile(){
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&usefulError(m.text()))errors.push(m.text())});
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
 await page.click('#startBtn');
 await page.evaluate(()=>{EVO.player.inv=999;EVO.player.score=80;EVO.player.x=1500;EVO.player.y=1050;EVO.player.a=0;EVO.player.ta=0;});
 await sleep(100);
 const box=await page.locator('#joystick').boundingBox();
 assert(!!box,'Mobile: joystick missing');
 if(box){
   const cx=box.x+box.width/2,cy=box.y+box.height/2;
   await page.dispatchEvent('#joystick','pointerdown',{pointerId:11,pointerType:'touch',clientX:cx+38,clientY:cy,bubbles:true});
   await sleep(120);
   let joy=await page.evaluate(()=>({input:{...EVO.input},mode:document.querySelector('#inputMode')?.textContent}));
   assert(joy.mode==='手机摇杆','Mobile: joystick did not switch to touch mode');
   assert(joy.input.x>0.85 && Math.abs(joy.input.y)<0.25,'Mobile: joystick right input is wrong');
   await page.dispatchEvent('#joystick','pointermove',{pointerId:11,pointerType:'touch',clientX:cx,clientY:cy-38,bubbles:true});
   await sleep(120);
   joy=await page.evaluate(()=>({input:{...EVO.input}}));
   assert(joy.input.y<-0.85,'Mobile: joystick drag did not update direction');
   await page.dispatchEvent('#joystick','pointerup',{pointerId:11,pointerType:'touch',clientX:cx,clientY:cy-38,bubbles:true});
 }

 const boostBox=await page.locator('#boostBtn').boundingBox();assert(!!boostBox,'Mobile: boost button missing');
 if(boostBox){
   const bx=boostBox.x+boostBox.width/2,by=boostBox.y+boostBox.height/2;
   await page.dispatchEvent('#boostBtn','pointerdown',{pointerId:21,pointerType:'touch',clientX:bx,clientY:by,bubbles:true});
   await sleep(120);
   let state=await page.evaluate(()=>({boost:EVO.input.boost,boosting:EVO.player.boosting,pressed:document.querySelector('#boostBtn').classList.contains('pressed')}));
   assert(state.boost&&state.boosting&&state.pressed,'Mobile: boost button did not engage');
   await page.dispatchEvent('#boostBtn','pointermove',{pointerId:21,pointerType:'touch',clientX:bx-120,clientY:by-120,bubbles:true});
   await sleep(80);
   state=await page.evaluate(()=>({boost:EVO.input.boost}));
   assert(state.boost===true,'Mobile: boost cancelled when finger drifted after pointer capture');
   await page.dispatchEvent('#boostBtn','pointerup',{pointerId:21,pointerType:'touch',clientX:bx-120,clientY:by-120,bubbles:true});
   await sleep(60);
   state=await page.evaluate(()=>({boost:EVO.input.boost}));
   assert(state.boost===false,'Mobile: boost did not release on pointerup');
 }
 assert(errors.length===0,'Mobile browser errors: '+errors.join(' | '));
 await context.close();
}

await desktop();
await mobile();
await browser.close();
if(failures.length){console.error('\nE2E FAILURES\n- '+failures.join('\n- '));process.exit(1)}
console.log('E2E PASS: desktop WASD, mouse follow, desktop boost, mobile joystick, mobile boost all functional and responsive.');