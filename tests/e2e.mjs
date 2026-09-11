import { chromium } from 'playwright-core';
import fs from 'node:fs';

const candidates=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=candidates.find(p=>fs.existsSync(p));
if(!executablePath) throw new Error('No Chromium/Chrome executable found on runner');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
const failures=[];
const assert=(cond,msg)=>{if(!cond)failures.push(msg)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function desktopControls(){
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});await page.click('#startBtn');
 await page.evaluate(()=>{EVO.player.inv=999;EVO.player.score=80;EVO.player.x=1500;EVO.player.y=1050;EVO.player.a=0;EVO.player.ta=0;});await sleep(120);
 assert(await page.locator('#intro').evaluate(e=>e.classList.contains('hidden')),'Desktop: start did not enter game');
 const p0=await page.evaluate(()=>({x:EVO.player.x,y:EVO.player.y}));
 await page.keyboard.down('w');await sleep(520);
 const w=await page.evaluate(()=>({y:EVO.player.y,input:{...EVO.input},mode:document.querySelector('#inputMode')?.textContent}));await page.keyboard.up('w');
 assert(w.mode==='WASD','Desktop: WASD mode did not activate');assert(w.input.y<-.9,'Desktop: W input vector wrong');assert(w.y<p0.y-25,'Desktop: W steering too sluggish');
 await page.mouse.move(1100,360);await sleep(180);
 const mouse=await page.evaluate(()=>({input:{...EVO.input},mode:document.querySelector('#inputMode')?.textContent}));
 assert(mouse.mode==='鼠标跟随','Desktop: mouse did not retake control');assert(mouse.input.x>.9&&Math.abs(mouse.input.y)<.2,'Desktop: mouse vector wrong');
 await page.evaluate(()=>{EVO.player.inv=999;EVO.player.score=80;EVO.player.a=0;EVO.player.ta=0;EVO.input.x=1;EVO.input.y=0;EVO.player.x=1500;EVO.player.y=1050;});await sleep(60);
 const b0=await page.evaluate(()=>({x:EVO.player.x,score:EVO.player.score}));await page.keyboard.down('Space');await sleep(260);
 const b1=await page.evaluate(()=>({x:EVO.player.x,boost:EVO.input.boost,boosting:EVO.player.boosting,score:EVO.player.score}));await page.keyboard.up('Space');
 assert(b1.boost&&b1.boosting,'Desktop: Space boost did not engage');assert(b1.x-b0.x>50,'Desktop: boost speed increase too weak');assert(b1.score<b0.score,'Desktop: boost did not consume length');
 assert(errors.length===0,'Desktop browser errors: '+errors.join(' | '));await page.close();
}

async function mobileControls(){
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});await page.click('#startBtn');
 await page.evaluate(()=>{EVO.player.inv=999;EVO.player.score=80;EVO.player.x=1500;EVO.player.y=1050;EVO.player.a=0;EVO.player.ta=0;});await sleep(100);
 const box=await page.locator('#joystick').boundingBox();assert(!!box,'Mobile: joystick missing');
 if(box){const cx=box.x+box.width/2,cy=box.y+box.height/2;await page.dispatchEvent('#joystick','pointerdown',{pointerId:11,pointerType:'touch',clientX:cx+38,clientY:cy,bubbles:true});await sleep(120);
  let joy=await page.evaluate(()=>({input:{...EVO.input},mode:document.querySelector('#inputMode')?.textContent}));assert(joy.mode==='手机摇杆','Mobile: joystick did not activate');assert(joy.input.x>.85&&Math.abs(joy.input.y)<.25,'Mobile: joystick right vector wrong');
  await page.dispatchEvent('#joystick','pointermove',{pointerId:11,pointerType:'touch',clientX:cx,clientY:cy-38,bubbles:true});await sleep(120);joy=await page.evaluate(()=>({input:{...EVO.input}}));assert(joy.input.y<-.85,'Mobile: joystick drag did not update');await page.dispatchEvent('#joystick','pointerup',{pointerId:11,pointerType:'touch',clientX:cx,clientY:cy-38,bubbles:true});}
 const boostBox=await page.locator('#boostBtn').boundingBox();assert(!!boostBox,'Mobile: boost button missing');
 if(boostBox){const bx=boostBox.x+boostBox.width/2,by=boostBox.y+boostBox.height/2;await page.dispatchEvent('#boostBtn','pointerdown',{pointerId:21,pointerType:'touch',clientX:bx,clientY:by,bubbles:true});await sleep(120);
  let s=await page.evaluate(()=>({boost:EVO.input.boost,boosting:EVO.player.boosting,pressed:document.querySelector('#boostBtn').classList.contains('pressed')}));assert(s.boost&&s.boosting&&s.pressed,'Mobile: boost did not engage');
  await page.dispatchEvent('#boostBtn','pointermove',{pointerId:21,pointerType:'touch',clientX:bx-120,clientY:by-120,bubbles:true});await sleep(80);s=await page.evaluate(()=>({boost:EVO.input.boost}));assert(s.boost,'Mobile: boost cancelled on finger drift');
  await page.dispatchEvent('#boostBtn','pointerup',{pointerId:21,pointerType:'touch',clientX:bx-120,clientY:by-120,bubbles:true});await sleep(60);s=await page.evaluate(()=>({boost:EVO.input.boost}));assert(!s.boost,'Mobile: boost did not release');}
 assert(errors.length===0,'Mobile browser errors: '+errors.join(' | '));await context.close();
}

async function fullGameFlow(){
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});await page.click('#startBtn');
 await page.evaluate(()=>{EVO.player.inv=999;EVO.player.score=121;});
 await page.waitForFunction(()=>!document.querySelector('#upgrade').classList.contains('hidden'),null,{timeout:2000});
 assert(await page.locator('.upgrade-card').count()===3,'Flow: upgrade did not offer exactly 3 choices');
 await page.locator('.upgrade-card').first().click();await sleep(120);
 const afterBuff=await page.evaluate(()=>({hidden:document.querySelector('#upgrade').classList.contains('hidden'),buffs:EVO.player.buffs.length,x:EVO.player.x}));
 assert(afterBuff.hidden&&afterBuff.buffs===1,'Flow: choosing Buff did not resume game');await sleep(180);
 const moved=await page.evaluate(()=>EVO.player.x!==undefined&&EVO.player.dead===false);assert(moved,'Flow: player not alive after Buff selection');
 await page.evaluate(()=>EVO.gameOver());await sleep(80);
 assert(!(await page.locator('#gameOver').evaluate(e=>e.classList.contains('hidden'))),'Flow: game-over panel did not appear');
 await page.click('#restartBtn');await sleep(120);
 const restarted=await page.evaluate(()=>({hidden:document.querySelector('#gameOver').classList.contains('hidden'),dead:EVO.player.dead,score:EVO.player.score}));
 assert(restarted.hidden&&!restarted.dead&&restarted.score>=80,'Flow: restart did not create a playable new run');
 assert(errors.length===0,'Flow browser errors: '+errors.join(' | '));await page.close();
}

await desktopControls();await mobileControls();await fullGameFlow();await browser.close();
if(failures.length){console.error('\nE2E FAILURES\n- '+failures.join('\n- '));process.exit(1)}
console.log('E2E PASS: desktop controls, mobile controls, boost, upgrade choice, resume, game over and restart all passed in Chromium.');