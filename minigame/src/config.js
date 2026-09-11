const TAU=Math.PI*2;
const WORLD={w:15000,h:10500};
const SIM={bots:30,foods:2200,localFoodMin:110,localFoodRadius:1250,near:1800,mid:3600,cell:240,fixedStep:1/60};
const NAMES=['泡芙','海盐','奶盖','栗子','团团','小葵','啵啵','桃桃','薄荷','豆乳','云朵','荔枝','可露露','小年糕','布丁','海星','柚子','糯米','青提','芝麻','小麦','星尘','珊瑚','月牙'];
const STAGES=[['幼鳞',0,12],['微光鳍',100,12.8],['潮鳍',220,13.6],['棘鲛',380,14.5],['角鲛',600,15.4],['雾蛟',900,16.3],['云蛟',1300,17.3],['曜甲龙',1850,18.4],['星环龙',2550,19.6],['天穹星龙',3400,21]];
const UPGRADE_MARKS=[110,220,380,600,900,1300,1800,2400,3100,3900];
const BOT_STYLES=['觅食型','猎手型','游荡型','伏击型','疯狗型','谨慎型'];
const SKINS=[
['jade-serpent','青玉灵蛇','🐍',['#d9fff4','#53ddb5','#167a73'],'scales','round'],['azure-dragon','云海青龙','🐉',['#d9ffff','#45d8cb','#276ab0'],'dragon','scale'],['ember-dragon','奶油火龙','🔥',['#fff1b3','#ff8a58','#c43a6b'],'flame','scale'],['coral-drake','珊瑚海龙','🪸',['#bffff3','#4fc9e8','#7356c8'],'coral','scale'],['bone-wyrm','白骨龙','☠️',['#fffef0','#d7d2bd','#73768e'],'bone','bone'],['mecha-serpent','霓虹机械蛇','🤖',['#c8ffff','#45b7ff','#4d3b8e'],'circuit','mech'],['jelly','蓝莓果冻','🫧',['#f2e7ff','#a68cff','#5265dc'],'bubble','jelly'],['cat-worm','猫猫虫','🐱',['#fff3d4','#ffc580','#d86c7a'],'cat','soft'],['dino','奶油小恐龙','🦖',['#eaffc6','#8ee27e','#498a6b'],'spots','scale'],['cloud','云朵虫','☁️',['#ffffff','#ccecff','#7da4d6'],'cloud','cloud'],['marshmallow','棉花糖','🍥',['#fff8ff','#ffb8d9','#9fc7ff'],'stripe','soft'],['star-candy','星星糖','⭐',['#fffac0','#ffca68','#ee709c'],'star','crystal'],['strawberry','草莓串','🍓',['#fff0d0','#ff5470','#b92750'],'strawberry','fruit'],['grape','葡萄串','🍇',['#f0d8ff','#9c65dc','#593796'],'grape','fruit'],['banana','香蕉船','🍌',['#fff8b0','#ffd44f','#c28b33'],'banana','fruit'],['watermelon','西瓜蛇','🍉',['#dbffbd','#5fca73','#e74d68'],'watermelon','fruit'],['pineapple','菠萝龙','🍍',['#fff1a5','#eebc39','#4e9b65'],'pineapple','fruit'],['fruit-mix','水果拼盘','🥭',['#fff2c0','#ff836f','#7ecb84'],'fruitmix','fruit'],['emoji-smile','哈哈蛇','😀',['#fff5a2','#ffd64b','#e58c3e'],'emoji','emoji'],['emoji-devil','恶魔蛇','😈',['#f5d4ff','#b35be2','#682b8f'],'emoji','emoji'],['emoji-cry','泪崩蛇','😭',['#fff2a0','#ffd34f','#58aee8'],'emoji','emoji'],['emoji-cool','墨镜蛇','😎',['#fff19a','#ffcf38','#755d50'],'emoji','emoji'],['emoji-clown','小丑蛇','🤡',['#ffffff','#f05a71','#52b7e8'],'emoji','emoji'],['emoji-poop','搞怪便便','💩',['#ffd79e','#a86b42','#5b3a35'],'emoji','emoji'],['burger','汉堡长龙','🍔',['#fff0b3','#e49b45','#7a4d31'],'icon','food'],['sushi','寿司卷卷','🍣',['#fff6eb','#ff8178','#33475f'],'icon','food'],['donut','甜甜圈','🍩',['#ffe4ef','#e894b3','#8f5f81'],'icon','food'],['bulb','灯泡蛇','💡',['#fffbd0','#ffe15a','#6aa6c8'],'icon','object'],['gem','宝石龙','💎',['#e3ffff','#5be1ff','#4367d5'],'gem','crystal'],['rocket','火箭列车','🚀',['#f4f5ff','#9ba5bf','#ff6f5d'],'icon','object']
].map(([id,name,icon,palette,motif,shape])=>({id,name,icon,palette,motif,shape}));
const BUFFS=[
{id:'magnet',name:'星环磁场',tag:'资源',desc:'吸取范围大幅扩大；青色磁力波沿全身传播。',fx:'magnet',apply:s=>s.mag+=90},
{id:'speed',name:'奶油闪电',tag:'机动',desc:'基础速度 +9%，冲刺 +10%；黄色电弧沿身体跳动。',fx:'speed',apply:s=>{s.speed*=1.09;s.boost*=1.10}},
{id:'feast',name:'贪食基因',tag:'成长',desc:'星光成长收益 +30%；粉红营养粒向头部汇聚。',fx:'feast',apply:s=>s.feast*=1.30},
{id:'turn',name:'云翼转向',tag:'操控',desc:'转向响应 +28%；白色羽流贴身滑动。',fx:'turn',apply:s=>s.turn*=1.28},
{id:'spore',name:'卫星孢子',tag:'资源',desc:'增加采集伴星，自动吞掉身体附近星光。',fx:'spore',apply:s=>s.orbiters++},
{id:'comet',name:'彗尾喷射',tag:'冲刺',desc:'冲刺消耗 -30%，蓝色彗尾更强。',fx:'comet',apply:s=>{s.boostCost*=.70;s.trail++}},
{id:'moon',name:'月潮尾鳍',tag:'混合',desc:'冲刺 +12%、转向 +10%；月弧沿全身交替出现。',fx:'moon',apply:s=>{s.boost*=1.12;s.turn*=1.10;s.fins++}},
{id:'kill',name:'星尘共鸣',tag:'击杀',desc:'诱导击杀额外获得 35 成长；金色星尘逆流。',fx:'kill',apply:s=>s.killBonus+=35},
{id:'combo',name:'连食脉冲',tag:'成长',desc:'连续吃星光叠加倍率，最高额外 +75%。',fx:'combo',apply:s=>{s.comboWindow=Math.max(s.comboWindow||0,2.2);s.comboStep=(s.comboStep||0)+.075}},
{id:'core',name:'星核震荡',tag:'资源',desc:'每吃若干星光触发范围吸收脉冲。',fx:'core',apply:s=>{s.pulseEvery=Math.max(6,(s.pulseEvery||14)-4);s.pulseRadius=(s.pulseRadius||0)+230}},
{id:'split',name:'游星分裂',tag:'资源',desc:'持续进食时在身体周围分裂出低价值游星。',fx:'split',apply:s=>s.splitEvery=Math.max(5,(s.splitEvery||11)-3)},
{id:'charge',name:'龙脉蓄能',tag:'冲刺',desc:'不冲刺时蓄能，下一次冲刺随蓄能额外提速。',fx:'charge',apply:s=>{s.chargeRate=(s.chargeRate||0)+.22;s.chargePower=(s.chargePower||0)+.5;s.charge=1}},
{id:'tide',name:'星潮共振',tag:'资源',desc:'磁力场周期性潮汐爆发，峰值扩大吸取范围。',fx:'tide',apply:s=>s.tideMag=(s.tideMag||0)+115},
{id:'corpse',name:'饕餮残响',tag:'击杀',desc:'击杀大型目标时按其体型追加残骸成长。',fx:'corpse',apply:s=>s.corpseFeast=(s.corpseFeast||0)+1.15},
{id:'rudder',name:'巨鳞舵机',tag:'操控',desc:'体型越大转向补偿越强。',fx:'rudder',apply:s=>s.sizeTurn=(s.sizeTurn||0)+.42},
{id:'overload',name:'超载采食',tag:'成长',desc:'冲刺时吃星光额外成长，鼓励高速抢食。',fx:'overload',apply:s=>s.boostFeast=(s.boostFeast||0)+.32}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.random()*a.length|0];
const angleDiff=(a,b)=>(b-a+Math.PI*3)%TAU-Math.PI;
const stageFor=score=>{let out=STAGES[0];for(const st of STAGES)if(score>=st[1])out=st;return out};
module.exports={TAU,WORLD,SIM,NAMES,STAGES,UPGRADE_MARKS,BOT_STYLES,SKINS,BUFFS,clamp,rnd,pick,angleDiff,stageFor};