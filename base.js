window.EVO={};
(()=>{
const G=window.EVO;
G.TAU=Math.PI*2;
G.WORLD={w:3000,h:2100};
G.names=['泡芙','海盐','奶盖','栗子','团团','小葵','啵啵','桃桃','薄荷','豆乳','云朵','荔枝'];
G.palettes=[['#8affdf','#48ced0','#287ea7'],['#ffd879','#ff936d','#d7598e'],['#dda9ff','#8b89ff','#5558bc'],['#9dff87','#59d8a7','#2d85a8'],['#ff9fd4','#de7bf2','#7668df']];
G.stages=[['幼鳞',0,12],['潮鳍',150,13.5],['角鲛',380,15],['云蛟',760,17],['星龙',1350,19]];
G.upgradeMarks=[120,280,520,850,1250,1750];
G.buffs=[
 ['🧲','星环磁场','资源','扩大吸取范围，蓝色磁环围绕身体。',s=>s.mag+=60],
 ['🫧','泡泡护甲','保命','获得一次碰撞容错，触发后护盾碎裂。',s=>s.shield++],
 ['⚡','奶油闪电','机动','基础速度与冲刺速度提高。',s=>{s.speed*=1.07;s.boost*=1.1}],
 ['🍓','贪食基因','成长','光点成长收益提高 28%。',s=>s.feast*=1.28],
 ['🪽','云翼转向','操控','转向响应提高，大体型更灵活。',s=>s.turn*=1.2],
 ['🔮','卫星孢子','视觉','增加一颗环绕孢子并辅助吸取光点。',s=>s.orbiters++],
 ['💫','彗尾喷射','冲刺','冲刺消耗降低 25%。',s=>s.boostCost*=.75]
];
G.rnd=(a,b)=>a+Math.random()*(b-a);
G.pick=a=>a[Math.random()*a.length|0];
G.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
G.lerp=(a,b,t)=>a+(b-a)*t;
G.angleDiff=(a,b)=>(b-a+Math.PI*3)%G.TAU-Math.PI;
G.stageFor=s=>{let out=G.stages[0];for(const st of G.stages)if(s.score>=st[1])out=st;return out};
})();