function noop(){}
function createPlatform(){
  if(typeof wx==='undefined')throw new Error('EvoSnake Mini Game requires WeChat Mini Game runtime');
  const canvas=wx.createCanvas(),ctx=canvas.getContext('2d'),resizeListeners=new Set();
  let info={},ratio=1,width=1280,height=720,rawWidth=1280,rawHeight=720,portraitSource=false;
  const readInfo=()=>wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();
  const normalize=src=>{
    const rw=Number(src?.windowWidth||src?.screenWidth||rawWidth||1280),rh=Number(src?.windowHeight||src?.screenHeight||rawHeight||720),pr=Number(src?.pixelRatio||ratio||1)||1;
    return{rawWidth:rw,rawHeight:rh,width:Math.max(rw,rh),height:Math.min(rw,rh),ratio:pr,portraitSource:rw<rh};
  };
  function resize(next,notify=true){
    const src=next||readInfo()||{};info={...info,...src};const n=normalize(info),changed=n.width!==width||n.height!==height||n.ratio!==ratio||n.portraitSource!==portraitSource;
    rawWidth=n.rawWidth;rawHeight=n.rawHeight;width=n.width;height=n.height;ratio=n.ratio;portraitSource=n.portraitSource;
    const pw=Math.max(1,Math.floor(width*ratio)),ph=Math.max(1,Math.floor(height*ratio));
    if(canvas.width!==pw)canvas.width=pw;if(canvas.height!==ph)canvas.height=ph;
    if(ctx.setTransform)ctx.setTransform(ratio,0,0,ratio,0,0);else if(ctx.scale)ctx.scale(ratio,ratio);
    if(changed&&notify)for(const fn of resizeListeners)try{fn({width,height,ratio,rawWidth,rawHeight,portraitSource})}catch{}
    return{width,height,ratio,rawWidth,rawHeight,portraitSource};
  }
  resize(readInfo(),false);
  const queueRefresh=()=>{for(const ms of [0,80,260])setTimeout(()=>{try{resize()}catch{}},ms)};
  if(wx.onWindowResize)wx.onWindowResize(e=>{try{resize(e&&e.size?{...info,...e.size}:null)}catch{}queueRefresh()});
  if(wx.onDeviceOrientationChange)wx.onDeviceOrientationChange(()=>queueRefresh());
  if(wx.setDeviceOrientation)try{wx.setDeviceOrientation({value:'landscape',complete:queueRefresh})}catch{}
  const raf=cb=>canvas.requestAnimationFrame?canvas.requestAnimationFrame(cb):(typeof requestAnimationFrame==='function'?requestAnimationFrame(cb):setTimeout(()=>cb(Date.now()),16));
  const caf=id=>canvas.cancelAnimationFrame?canvas.cancelAnimationFrame(id):(typeof cancelAnimationFrame==='function'?cancelAnimationFrame(id):clearTimeout(id));
  return{
    wx,canvas,ctx,raf,caf,now:()=>Date.now(),get width(){return width},get height(){return height},get ratio(){return ratio},get rawWidth(){return rawWidth},get rawHeight(){return rawHeight},get portraitSource(){return portraitSource},resize,
    onResize:fn=>{resizeListeners.add(fn);return()=>resizeListeners.delete(fn)},
    onTouchStart:fn=>wx.onTouchStart?wx.onTouchStart(fn):noop,onTouchMove:fn=>wx.onTouchMove?wx.onTouchMove(fn):noop,onTouchEnd:fn=>wx.onTouchEnd?wx.onTouchEnd(fn):noop,onTouchCancel:fn=>wx.onTouchCancel?wx.onTouchCancel(fn):noop,
    getStorage:(k,d)=>{try{const v=wx.getStorageSync(k);return v===''||v==null?d:v}catch{return d}},setStorage:(k,v)=>{try{wx.setStorageSync(k,v)}catch{}},vibrate:()=>{try{wx.vibrateShort&&wx.vibrateShort({type:'light'})}catch{}},
    setKeepScreenOn:()=>{try{wx.setKeepScreenOn&&wx.setKeepScreenOn({keepScreenOn:true})}catch{}}
  }
}
module.exports={createPlatform};