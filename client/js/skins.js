// Catálogo de skins dibujadas proceduralmente (cuerpo + sombrero + estela)
const SKINS=[
 {id:'neo',name:'Neo',rar:'Común',body:'#18c8ff',acc:'#fff',shape:'round',hat:'none',trail:'#18c8ff'},
 {id:'ember',name:'Ember',rar:'Común',body:'#ff6a2a',acc:'#ffd23a',shape:'square',hat:'none',trail:'#ff6a2a'},
 {id:'toxic',name:'Toxic',rar:'Común',body:'#7dff3a',acc:'#143',shape:'tri',hat:'antenna',trail:'#7dff3a'},
 {id:'ninja',name:'Sombra',rar:'Raro',body:'#222',acc:'#f22',shape:'round',hat:'visor',trail:'#f22'},
 {id:'bee',name:'Abejón',rar:'Raro',body:'#ffd000',acc:'#111',shape:'hex',hat:'antenna',trail:'#ffd000'},
 {id:'ice',name:'Cryo',rar:'Raro',body:'#bff',acc:'#3af',shape:'hex',hat:'none',trail:'#8ef'},
 {id:'demon',name:'Diablillo',rar:'Épico',body:'#c01438',acc:'#ff0',shape:'tri',hat:'horns',trail:'#f24'},
 {id:'void',name:'Vacío',rar:'Épico',body:'#4a1a8a',acc:'#e0f',shape:'hex',hat:'visor',trail:'#b3f'},
 {id:'king',name:'El Rey',rar:'Legendario',body:'#ffb400',acc:'#fff',shape:'square',hat:'crown',trail:'#fd5'},
 {id:'rgb',name:'Prisma',rar:'Legendario',body:'#fff',acc:'#000',shape:'round',hat:'crown',trail:'#fff',rainbow:1}
];
function skinColor(s,t){return s.rainbow?`hsl(${(t*120)%360},100%,60%)`:s.body}
function drawSkin(c,s,x,y,r,ang,t,glow){
 c.save();c.translate(x,y);const col=skinColor(s,t);if(glow){c.shadowColor=s.rainbow?col:s.trail;c.shadowBlur=18}
 c.save();c.rotate(ang);c.fillStyle='#667';c.fillRect(r*.4,-r*.18,r*1.05,r*.36);c.fillStyle=s.acc;c.fillRect(r*1.2,-r*.22,r*.3,r*.44);c.restore();
 c.fillStyle=col;c.strokeStyle=s.rainbow?'#fff':s.acc;c.lineWidth=r*.12;c.beginPath();
 const n={round:0,square:4,tri:3,hex:6}[s.shape];
 if(!n)c.arc(0,0,r,0,7);else{for(let i=0;i<n;i++){const a=ang+i*6.283/n+(n==4?.785:0);c.lineTo(Math.cos(a)*r*1.1,Math.sin(a)*r*1.1)}c.closePath()}
 c.fill();c.stroke();c.shadowBlur=0;
 const ex=Math.cos(ang)*r*.35,ey=Math.sin(ang)*r*.35,px=-Math.sin(ang)*r*.25,py=Math.cos(ang)*r*.25;
 c.fillStyle='#fff';c.beginPath();c.arc(ex+px,ey+py,r*.2,0,7);c.fill();c.beginPath();c.arc(ex-px,ey-py,r*.2,0,7);c.fill();
 c.fillStyle=s.acc;c.strokeStyle=s.acc;c.lineWidth=r*.1;
 if(s.hat=='horns'){[-1,1].forEach(k=>{c.beginPath();c.moveTo(k*r*.4,-r*.7);c.lineTo(k*r*.7,-r*1.5);c.lineTo(k*r*.9,-r*.6);c.fill()})}
 if(s.hat=='crown'){c.fillStyle=s.rainbow?'#fd5':s.acc;c.beginPath();c.moveTo(-r*.6,-r*.8);c.lineTo(-r*.6,-r*1.5);c.lineTo(-r*.3,-r*1.1);c.lineTo(0,-r*1.6);c.lineTo(r*.3,-r*1.1);c.lineTo(r*.6,-r*1.5);c.lineTo(r*.6,-r*.8);c.fill()}
 if(s.hat=='antenna'){c.beginPath();c.moveTo(0,-r);c.lineTo(0,-r*1.6);c.stroke();c.beginPath();c.arc(0,-r*1.7,r*.18,0,7);c.fill()}
 if(s.hat=='visor'){c.globalAlpha=.8;c.fillRect(-r*.7,-r*.3,r*1.4,r*.28);c.globalAlpha=1}
 c.restore()}
