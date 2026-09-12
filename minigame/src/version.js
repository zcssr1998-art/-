const RELEASE={
  version:'v0.7.1',
  time:'2026-09-12 14:03 北京时间',
  title:'iOS 横屏画布适配修复',
  notes:[
    '修复部分 iPhone 真机横屏后，Canvas 内容仍按竖屏坐标绘制、导致整张界面侧转的问题。',
    '启动时统一将小游戏逻辑画布规范为横屏宽高，并主动请求 landscape 方向。',
    '同时监听设备方向与窗口尺寸变化，转屏完成后会再次重建 Canvas、游戏视口和触控布局。',
    '保留巨型成长：后期体型最高约 10 倍，碰撞判定与 NPC 避障同步放大。'
  ]
};

function wrap(ctx,text,maxWidth){
  const lines=[];let row='';
  for(const ch of text){const next=row+ch;if(row&&ctx.measureText(next).width>maxWidth){lines.push(row);row=ch}else row=next}
  if(row)lines.push(row);return lines;
}

function installVersionInfo({Renderer,Input}){
  if(!Renderer||!Input||Renderer.prototype.__versionInfoInstalled)return;
  Renderer.prototype.__versionInfoInstalled=true;

  Renderer.prototype.drawReleaseBadge=function(){
    if(this.g.state!=='intro')return;
    const X=this.ctx,w=this.p.width,h=this.p.height,pw=Math.min(620,w-40),ph=Math.min(360,h-32),x=(w-pw)/2,y=(h-ph)/2;
    const bw=116,bh=28,bx=x+pw-bw-14,by=y+14;
    this.hitboxes.release={x:bx,y:by,w:bw,h:bh};
    X.save();X.fillStyle='rgba(24,42,78,.94)';X.strokeStyle='rgba(126,235,255,.42)';X.lineWidth=1;X.beginPath();X.rect(bx,by,bw,bh);X.fill();X.stroke();
    X.fillStyle='#7ff2e5';X.beginPath();X.arc(bx+14,by+14,8,0,Math.PI*2);X.fill();X.fillStyle='#0b1930';X.font='bold 11px sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillText('i',bx+14,by+14.5);
    X.fillStyle='#dffcff';X.font='bold 11px sans-serif';X.textAlign='left';X.fillText(`${RELEASE.version} 更新`,bx+29,by+15);X.restore();
  };

  Renderer.prototype.drawReleaseNotice=function(){
    const X=this.ctx,w=this.p.width,h=this.p.height,pw=Math.min(560,w-34),ph=Math.min(310,h-28),x=(w-pw)/2,y=(h-ph)/2;
    X.save();X.fillStyle='rgba(2,7,18,.82)';X.fillRect(0,0,w,h);X.fillStyle='rgba(12,23,50,.98)';X.strokeStyle='rgba(150,225,255,.28)';X.lineWidth=1;X.beginPath();X.rect(x,y,pw,ph);X.fill();X.stroke();
    X.textAlign='left';X.textBaseline='alphabetic';X.fillStyle='#7ff3e4';X.font='bold 12px sans-serif';X.fillText('VERSION UPDATE',x+24,y+28);
    X.fillStyle='#ffffff';X.font='bold 22px sans-serif';X.fillText(`版本更新公告  ${RELEASE.version}`,x+24,y+57);
    X.fillStyle='#9fb2d6';X.font='11px sans-serif';X.fillText(RELEASE.time,x+24,y+79);
    X.fillStyle='#dceaff';X.font='bold 14px sans-serif';X.fillText(RELEASE.title,x+24,y+106);
    X.font='12px sans-serif';X.fillStyle='#bdcbea';let yy=y+132;
    for(const note of RELEASE.notes){const lines=wrap(X,`• ${note}`,pw-48);for(const line of lines){X.fillText(line,x+24,yy);yy+=18}yy+=3}
    const cbw=96,cbh=34,cbx=x+pw-cbw-22,cby=y+ph-cbh-18;this.hitboxes.releaseClose={x:cbx,y:cby,w:cbw,h:cbh};
    X.fillStyle='#74e8d4';X.fillRect(cbx,cby,cbw,cbh);X.fillStyle='#102038';X.font='bold 13px sans-serif';X.textAlign='center';X.fillText('关闭',cbx+cbw/2,cby+22);X.restore();
  };

  const oldIntro=Renderer.prototype.intro;
  Renderer.prototype.intro=function(){oldIntro.call(this);this.drawReleaseBadge();if(this.releaseOpen)this.drawReleaseNotice()};

  const oldUiTap=Input.prototype.uiTap;
  Input.prototype.uiTap=function(p){
    if(this.g.state==='intro'){
      const h=this.r.hitboxes||{};
      if(this.r.releaseOpen){if(this.inside(p,h.releaseClose))this.r.releaseOpen=false;return true}
      if(this.inside(p,h.release)){this.r.releaseOpen=true;if(this.p.vibrate)this.p.vibrate();return true}
    }
    return oldUiTap.call(this,p);
  };
}

module.exports={RELEASE,installVersionInfo};