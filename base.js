window.EVO={};
(()=>{
const G=window.EVO;
G.TAU=Math.PI*2;
G.WORLD={w:3000,h:2100};
G.names=['泡芙','海盐','奶盖','栗子','团团','小葵','啵啵','桃桃','薄荷','豆乳','云朵','荔枝','可露露','小年糕','布丁','海星'];
G.palettes=[['#8affdf','#48ced0','#287ea7'],['#ffd879','#ff936d','#d7598e'],['#dda9ff','#8b89ff','#5558bc'],['#9dff87','#59d8a7','#2d85a8'],['#ff9fd4','#de7bf2','#7668df'],['#fff0a6','#ffba63','#ec6d78']];
G.stages=[['幼鳞',0,12],['潮鳍',150,13.5],['角鲛',380,15],['云蛟',760,17],['星龙',1350,19]];
G.upgradeMarks=[120,280,520,850,1250,1750];
G.botStyles=['觅食型','猎手型','游荡型'];
G.buffs=[
 ['🧲','星环磁场','资源','扩大光点吸取范围，蓝色磁环会一直围绕身体。',s=>s.mag+=58],
 ['⚡','奶油闪电','机动','基础速度提高 6%，冲刺速度提高 9%。',s=>{s.speed*=1.06;s.boost*=1.09}],
 ['🍓','贪食基因','成长','所有光点成长收益提高 25%。',s=>s.feast*=1.25],
 ['🪽','云翼转向','操控','转向响应提高 18%，大体型更容易做极限走位。',s=>s.turn*=1.18],
 ['🔮','卫星孢子','资源','增加一颗环绕伴星，自动吞掉贴近伴星的光点。',s=>s.orbiters++],
 ['💫','彗尾喷射','冲刺','冲刺消耗降低 22%，尾部出现更明显的彗星拖尾。',s=>{s.boostCost*=.78;s.trail++}],
 ['🌙','月潮尾鳍','混合','冲刺与转向同时小幅强化，适合做高速绕杀。',s=>{s.boost*=1.07;s.turn*=1.07;s.fins++}],
 ['✨','星尘共鸣','击杀','每次成功诱导对手撞死时获得更多成长奖励。',s=>s.killBonus+=18]
];
G.rnd=(a,b)=>a+Math.random()*(b-a);
G.pick=a=>a[Math.random()*a.length|0];
G.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
G.lerp=(a,b,t)=>a+(b-a)*t;
G.angleDiff=(a,b)=>(b-a+Math.PI*3)%G.TAU-Math.PI;
G.stageFor=s=>{let out=G.stages[0];for(const st of G.stages)if(s.score>=st[1])out=st;return out};
})();