function noop(){}
function createPlatform(){
  if(typeof wx==='undefined')throw new Error('EvoSnake Mini Game requires WeChat Mini Game runtime');
  const canvas=wx.createCanvas();let info=(wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync()),ratio=info.pixelRatio||1,width=info.windowWidth||1280,height=info.windowHeight||720;
  const ctx=canvas.getContext('2d');
  function resize(next){info=next|| (wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync());ratio=info.pixelRatio||1;width=info.windowWidth||width;height=info.windowHeight||height;canvas.width=Math.max(1,Math.floor(width*ratio));canvas.height=Math.max(1,Math.floor(height*ratio));if(ctx.setTransform)ctx.setTransform(ratio,0,0,ratio,0,0);else if(ctx.scale)ctx.scale(ratio,ratio);return{width,height,ratio}}
  resize(info);
  if(wx.onWindowResize)wx.onWindowResize(e=>resize(e&&e.size?{...info,...e.size}:null));
  const raf=cb=>canvas.requestAnimationFrame?canvas.requestAnimationFrame(cb):(typeof requestAnimationFrame==='function'?requestAnimationFrame(cb):setTimeout(()=>cb(Date.now()),16));
  const caf=id=>canvas.cancelAnimationFrame?canvas.cancelAnimationFrame(id):(typeof cancelAnimationFrame==='function'?cancelAnimationFrame(id):clearTimeout(id));
  return{
    wx,canvas,ctx,raf,caf,now:()=>Date.now(),get width(){return width},get height(){return height},get ratio(){return ratio},resize,
    onTouchStart:fn=>wx.onTouchStart?wx.onTouchStart(fn):noop,onTouchMove:fn=>wx.onTouchMove?wx.onTouchMove(fn):noop,onTouchEnd:fn=>wx.onTouchEnd?wx.onTouchEnd(fn):noop,onTouchCancel:fn=>wx.onTouchCancel?wx.onTouchCancel(fn):noop,
    getStorage:(k,d)=>{try{const v=wx.getStorageSync(k);return v===''||v==null?d:v}catch{return d}},setStorage:(k,v)=>{try{wx.setStorageSync(k,v)}catch{}},vibrate:()=>{try{wx.vibrateShort&&wx.vibrateShort({type:'light'})}catch{}},
    setKeepScreenOn:()=>{try{wx.setKeepScreenOn&&wx.setKeepScreenOn({keepScreenOn:true})}catch{}}
  }
}
module.exports={createPlatform};