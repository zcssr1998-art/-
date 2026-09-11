window.EVO={};
(()=>{
const G=window.EVO;
G.TAU=Math.PI*2;
G.WORLD={w:15000,h:10500};
G.SIM={bots:30,foods:2200,localFoodMin:105,localFoodRadius:1250,near:1800,mid:3600,cell:240,fixedStep:1/60};
G.names=['泡芙','海盐','奶盖','栗子','团团','小葵','啵啵','桃桃','薄荷','豆乳','云朵','荔枝','可露露','小年糕','布丁','海星','柚子','糯米','青提','芝麻','小麦','星尘','珊瑚','月牙'];
G.palettes=[['#8affdf','#48ced0','#287ea7'],['#ffd879','#ff936d','#d7598e'],['#dda9ff','#8b89ff','#5558bc'],['#9dff87','#59d8a7','#2d85a8'],['#ff9fd4','#de7bf2','#7668df'],['#fff0a6','#ffba63','#ec6d78']];
G.stages=[
 ['幼鳞',0,12],['微光鳍',100,12.8],['潮鳍',220,13.6],['棘鲛',380,14.5],['角鲛',600,15.4],
 ['雾蛟',900,16.3],['云蛟',1300,17.3],['曜甲龙',1850,18.4],['星环龙',2550,19.6],['天穹星龙',3400,21]
];
G.upgradeMarks=[110,220,380,600,900,1300,1800,2400,3100,3900];
G.botStyles=['觅食型','猎手型','游荡型','伏击型','疯狗型','谨慎型'];
G.buffs=[
 ['🧲','星环磁场','资源','吸取范围大幅扩大；青色磁力波沿全身向尾部传播。',s=>s.mag+=90,'magnet'],
 ['⚡','奶油闪电','机动','基础速度 +9%，冲刺速度 +10%；身体持续跳动黄色电弧。',s=>{s.speed*=1.09;s.boost*=1.10},'speed'],
 ['🍓','贪食基因','成长','所有星光成长收益 +30%；粉红营养粒沿身体向头部汇聚。',s=>s.feast*=1.30,'feast'],
 ['🪽','云翼转向','操控','转向响应 +28%；白色羽流贴着身体两侧滑动。',s=>s.turn*=1.28,'turn'],
 ['🔮','卫星孢子','资源','增加一颗采集伴星，自动吞掉经过身体附近的星光。',s=>s.orbiters++,'spore'],
 ['💫','彗尾喷射','冲刺','冲刺消耗 -30%，并强化蓝色彗尾流。',s=>{s.boostCost*=.70;s.trail++},'comet'],
 ['🌙','月潮尾鳍','混合','冲刺 +12%、转向 +10%；月牙波纹沿身体交替出现。',s=>{s.boost*=1.12;s.turn*=1.10;s.fins++},'moon'],
 ['✨','星尘共鸣','击杀','每次诱导对手撞死额外获得 35 成长；金色星尘从尾部涌向头部。',s=>s.killBonus+=35,'kill'],
 ['🔥','连食脉冲','成长','短时间连续吃星光会叠加连食倍率，最高额外 +75%。',s=>{s.comboWindow=Math.max(s.comboWindow||0,2.2);s.comboStep=(s.comboStep||0)+.075},'combo'],
 ['💎','星核震荡','资源','每吃 10 颗星光触发一次范围吸收脉冲，瞬间卷走附近星光。',s=>{s.pulseEvery=Math.max(6,(s.pulseEvery||14)-4);s.pulseRadius=(s.pulseRadius||0)+230},'core'],
 ['🌱','游星分裂','资源','每吃 8 颗星光，在身体周围分裂出数颗低价值游星。',s=>s.splitEvery=Math.max(5,(s.splitEvery||11)-3),'split'],
 ['🐉','龙脉蓄能','冲刺','不冲刺时蓄能；下一次冲刺随蓄能量额外提速，最高约 +50%。',s=>{s.chargeRate=(s.chargeRate||0)+.22;s.chargePower=(s.chargePower||0)+.5;s.charge=1},'charge'],
 ['🌊','星潮共振','资源','磁力场周期性潮汐爆发，峰值时吸取范围再大幅扩大。',s=>s.tideMag=(s.tideMag||0)+115,'tide'],
 ['☠️','饕餮残响','击杀','击杀大型目标时按对方体型追加残骸成长奖励。',s=>s.corpseFeast=(s.corpseFeast||0)+1.15,'corpse'],
 ['🌀','巨鳞舵机','操控','体型越大转向补偿越强，专门抵消后期大蛇的笨重感。',s=>s.sizeTurn=(s.sizeTurn||0)+.42,'rudder'],
 ['🌈','超载采食','成长','冲刺状态吃到星光时再获得额外成长，鼓励高速抢食。',s=>s.boostFeast=(s.boostFeast||0)+.32,'overload']
];
G.rnd=(a,b)=>a+Math.random()*(b-a);
G.pick=a=>a[Math.random()*a.length|0];
G.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
G.lerp=(a,b,t)=>a+(b-a)*t;
G.angleDiff=(a,b)=>(b-a+Math.PI*3)%G.TAU-Math.PI;
G.stageFor=s=>{let out=G.stages[0];for(const st of G.stages)if(s.score>=st[1])out=st;return out};
})();