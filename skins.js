(()=>{
const G=window.EVO;
const S=(id,name,icon,palette,motif,shape='round')=>({id,name,icon,palette,motif,shape});
G.skins=[
 S('jade-serpent','青玉灵蛇','🐍',['#d9fff4','#53ddb5','#167a73'],'scales'),
 S('azure-dragon','云海青龙','🐉',['#d9ffff','#45d8cb','#276ab0'],'dragon','scale'),
 S('ember-dragon','奶油火龙','🔥',['#fff1b3','#ff8a58','#c43a6b'],'flame','scale'),
 S('coral-drake','珊瑚海龙','🪸',['#bffff3','#4fc9e8','#7356c8'],'coral','scale'),
 S('bone-wyrm','白骨龙','☠️',['#fffef0','#d7d2bd','#73768e'],'bone','bone'),
 S('mecha-serpent','霓虹机械蛇','🤖',['#c8ffff','#45b7ff','#4d3b8e'],'circuit','mech'),
 S('jelly','蓝莓果冻','🫧',['#f2e7ff','#a68cff','#5265dc'],'bubble','jelly'),
 S('cat-worm','猫猫虫','🐱',['#fff3d4','#ffc580','#d86c7a'],'cat','soft'),
 S('dino','奶油小恐龙','🦖',['#eaffc6','#8ee27e','#498a6b'],'spots','scale'),
 S('cloud','云朵虫','☁️',['#ffffff','#ccecff','#7da4d6'],'cloud','cloud'),
 S('marshmallow','棉花糖','🍥',['#fff8ff','#ffb8d9','#9fc7ff'],'stripe','soft'),
 S('star-candy','星星糖','⭐',['#fffac0','#ffca68','#ee709c'],'star','crystal'),
 S('strawberry','草莓串','🍓',['#fff0d0','#ff5470','#b92750'],'strawberry','fruit'),
 S('grape','葡萄串','🍇',['#f0d8ff','#9c65dc','#593796'],'grape','fruit'),
 S('banana','香蕉船','🍌',['#fff8b0','#ffd44f','#c28b33'],'banana','fruit'),
 S('watermelon','西瓜蛇','🍉',['#dbffbd','#5fca73','#e74d68'],'watermelon','fruit'),
 S('pineapple','菠萝龙','🍍',['#fff1a5','#eebc39','#4e9b65'],'pineapple','fruit'),
 S('fruit-mix','水果拼盘','🥭',['#fff2c0','#ff836f','#7ecb84'],'fruitmix','fruit'),
 S('emoji-smile','哈哈蛇','😀',['#fff5a2','#ffd64b','#e58c3e'],'emoji','emoji'),
 S('emoji-devil','恶魔蛇','😈',['#f5d4ff','#b35be2','#682b8f'],'emoji','emoji'),
 S('emoji-cry','泪崩蛇','😭',['#fff2a0','#ffd34f','#58aee8'],'emoji','emoji'),
 S('emoji-cool','墨镜蛇','😎',['#fff19a','#ffcf38','#755d50'],'emoji','emoji'),
 S('emoji-clown','小丑蛇','🤡',['#fff','#f05a71','#52b7e8'],'emoji','emoji'),
 S('emoji-poop','搞怪便便','💩',['#ffd79e','#a86b42','#5b3a35'],'emoji','emoji'),
 S('burger','汉堡长龙','🍔',['#fff0b3','#e49b45','#7a4d31'],'icon','food'),
 S('sushi','寿司卷卷','🍣',['#fff6eb','#ff8178','#33475f'],'icon','food'),
 S('donut','甜甜圈','🍩',['#ffe4ef','#e894b3','#8f5f81'],'icon','food'),
 S('bulb','灯泡蛇','💡',['#fffbd0','#ffe15a','#6aa6c8'],'icon','object'),
 S('gem','宝石龙','💎',['#e3ffff','#5be1ff','#4367d5'],'gem','crystal'),
 S('rocket','火箭列车','🚀',['#f4f5ff','#9ba5bf','#ff6f5d'],'icon','object')
];
G.skinById=id=>G.skins.find(s=>s.id===id)||G.skins[0];
let selected=0;try{selected=Math.max(0,G.skins.findIndex(s=>s.id===localStorage.getItem('evo_skin')))}catch{}if(selected<0)selected=0;
G.getSelectedSkin=()=>G.skins[selected];
function refresh(){const s=G.skins[selected],icon=document.getElementById('skinIcon'),name=document.getElementById('skinName'),count=document.getElementById('skinCount');if(icon)icon.textContent=s.icon;if(name)name.textContent=s.name;if(count)count.textContent=`${selected+1}/30`;try{localStorage.setItem('evo_skin',s.id)}catch{}}
function step(d){selected=(selected+d+G.skins.length)%G.skins.length;refresh()}
const prev=document.getElementById('skinPrev'),next=document.getElementById('skinNext'),random=document.getElementById('skinRandom');if(prev)prev.onclick=()=>step(-1);if(next)next.onclick=()=>step(1);if(random)random.onclick=()=>{selected=Math.random()*G.skins.length|0;refresh()};refresh();
})();