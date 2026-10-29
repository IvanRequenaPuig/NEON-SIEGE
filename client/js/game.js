// Motor del juego: shooter top-down por oleadas. Solo o co-op online (el anfitrión simula; los demás envían su control y reciben el estado)
const Game={
 cv:null,c:null,run:false,paused:false,keys:{},mouse:{x:0,y:0,down:false},last:0,t:0,fpsA:0,fpsN:0,net:null,myw:0,dashQ:0,W:0,H:0,sc:1,ox:0,oy:0,sendT:0,ps:[],
 fit(){const w=this.cv.width,h=this.cv.height;if(this.net){this.W=1280;this.H=720;this.sc=Math.min(w/1280,h/720);this.ox=(w-1280*this.sc)/2;this.oy=(h-720*this.sc)/2}else{this.W=w;this.H=h;this.sc=1;this.ox=this.oy=0}},
 init(){this.cv=document.getElementById('game');this.c=this.cv.getContext('2d');
  const rs=()=>{this.cv.width=innerWidth;this.cv.height=innerHeight;this.fit()};rs();addEventListener('resize',rs);
  addEventListener('keydown',e=>{if(!this.run)return;this.keys[e.code]=1;const k=Store.d.keys;if(e.code==k.pause)this.pause(!this.paused);if(!this.paused){if(e.code==k.dash)this.dashQ=1;if(e.code==k.weapon)this.setW((this.myw+1)%3);if(e.code=='Digit1')this.setW(0);if(e.code=='Digit2')this.setW(1);if(e.code=='Digit3')this.setW(2)}if(e.code.startsWith('Arrow')||e.code=='Space')e.preventDefault()});
  addEventListener('keyup',e=>delete this.keys[e.code]);
  this.cv.addEventListener('mousemove',e=>{this.mouse.x=(e.clientX-this.ox)/this.sc;this.mouse.y=(e.clientY-this.oy)/this.sc});
  this.cv.addEventListener('mousedown',()=>this.mouse.down=true);addEventListener('mouseup',()=>this.mouse.down=false);
  this.cv.addEventListener('contextmenu',e=>e.preventDefault())},
 setW(w){this.myw=w;if(this.p)this.p.weapon=w},
 sk(p){return SKINS.find(s=>s.id==p.skin)||SKINS[0]},
 // net: null (solo) | 'host' | 'client'
 start(net,roster){this.net=net||null;this.fit();this.mult=+Store.d.difficulty;this.myw=0;this.dashQ=0;
  this.ps=[];this.b=[];this.eb=[];this.en=[];this.pt=[];this.pk=[];this.score=0;this.wave=0;this.queue=0;this.spT=0;this.shake=0;this.t=0;this.eid=0;this.ev=[];this.snd_=new Set();this.sendT=0;
  if(this.net=='client')this.p={id:-1,x:640,y:360,hp:100,weapon:0,ang:0,skin:Store.d.skin,name:'',inv:0,rapid:0,dead:0};
  else{if(this.net)roster.forEach(r=>this.addP(r.id,r.name,r.skin));else this.addP(0,Store.d.name,Store.d.skin);this.p=this.ps.find(p=>p.id==0)}
  this.hint();this.run=true;this.paused=false;this.dead=false;
  if(this.net=='client')document.getElementById('wave').textContent='OLEADA 1';else this.nextWave();
  this.last=performance.now();requestAnimationFrame(n=>this.loop(n))},
 addP(id,name,skin){const n=this.ps.length,p={id,name,skin,x:this.W/2+(n%2?1:-1)*Math.ceil(n/2)*50,y:this.H/2,vx:0,vy:0,hp:100,cd:0,dashT:0,dashCd:0,ang:0,inv:0,rapid:0,weapon:0,dead:0,in:{dx:0,dy:0,a:0,f:0,d:0,w:0}};this.ps.push(p);return p},
 drop(id){this.ps=(this.ps||[]).filter(p=>p.id!=id)},
 input(id,m){const p=this.ps.find(x=>x.id==id);if(!p)return;const i=p.in,c=v=>Math.max(-1,Math.min(1,+v||0));i.dx=c(m.dx);i.dy=c(m.dy);i.a=+m.a||0;i.f=m.f?1:0;i.d=i.d||(m.d?1:0);i.w=m.w|0},
 pause(v){if(this.dead)return;this.paused=v;document.getElementById('pause').hidden=!v;if(!v&&!this.net){this.last=performance.now();requestAnimationFrame(n=>this.loop(n))}},
 stop(){this.run=false;Audio_.stop()},
 snd(n){Audio_.sfx(n);if(this.net=='host')this.snd_.add(n)},
 nextWave(){this.wave++;const n=this.ps.length;this.queue=Math.round((4+this.wave*2.5)*this.mult*(1+.6*(n-1)));this.spT=0;
  for(const p of this.ps)if(p.dead){p.dead=0;p.hp=50;p.inv=2;p.x=this.W/2;p.y=this.H/2}
  this.banner('OLEADA '+this.wave);this.snd('wave');document.getElementById('wave').textContent='OLEADA '+this.wave;
  if(this.wave%5==0){this.queue=Math.round(this.queue/2);this.banner('¡JEFE! OLEADA '+this.wave);const hp=Math.round((50+this.wave*6)*(1+.5*(n-1)));this.en.push({id:this.eid++,x:this.W/2,y:-60,type:'boss',hp,maxhp:hp,sp:45,r:46,col:'#ff2a2a',sc:500,fire:2})}},
 banner(t){if(this.net=='host')this.ev.push(['bn',t]);const b=document.getElementById('banner');b.textContent=t;b.style.opacity=1;setTimeout(()=>b.style.opacity=0,1400)},
 spawn(){const W=this.W,H=this.H,s=Math.random()*4|0,x=s<2?(s?W+30:-30):Math.random()*W,y=s>=2?(s==3?H+30:-30):Math.random()*H;
  const r=Math.random(),w=this.wave,type=r<.15+w*.02&&w>2?'tank':r<.35+w*.02&&w>1?'shooter':'chaser';
  const T={chaser:{hp:2,sp:100,r:14,col:'#ff3a6a',sc:10},shooter:{hp:3,sp:70,r:15,col:'#ffb13a',sc:25},tank:{hp:9,sp:55,r:26,col:'#b13aff',sc:60}}[type];
  this.en.push({id:this.eid++,x,y,type,...T,maxhp:T.hp,fire:1+Math.random()*2,sp:T.sp*(1+w*.03)*Math.min(1.3,this.mult)})},
 WEAPONS:[{n:'PISTOLA',r:.16,k:1,sp:.04,l:1.2,v:750},{n:'ESCOPETA',r:.55,k:7,sp:.35,l:.55,v:700},{n:'AMETRALLADORA',r:.075,k:1,sp:.14,l:1.1,v:850}],
 hint(){const h=document.getElementById('hint');h.style.opacity=1;setTimeout(()=>h.style.opacity=0,7000)},
 fire(p){const w=this.WEAPONS[p.weapon];p.cd=w.r*(p.rapid>0?.55:1);
  for(let i=0;i<w.k;i++){const a=p.ang+(Math.random()-.5)*w.sp,v=w.v*(.9+Math.random()*.2);this.b.push({x:p.x+Math.cos(p.ang)*30,y:p.y+Math.sin(p.ang)*30,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:w.l})}
  this.snd('shoot');if(p==this.p)this.shake=Math.max(this.shake,p.weapon==1?5:1.5)},
 burst(x,y,col,n,sp=200){if(this.net=='host')this.ev.push(['p',x|0,y|0,col,n,sp]);const k=Store.d.particles/100;n=Math.round(n*k);for(let i=0;i<n;i++){const a=Math.random()*6.28,s=Math.random()*sp;this.pt.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:.5+Math.random()*.4,col})}},
 loop(now){if(!this.run||(!this.net&&this.paused))return;const dt=Math.min(.05,(now-this.last)/1000);this.last=now;this.t+=dt;this.update(dt);this.draw();
  if(Store.d.fps){this.fpsA+=dt;this.fpsN++;if(this.fpsA>.5){document.getElementById('fpsBox').textContent=Math.round(this.fpsN/this.fpsA)+' FPS';this.fpsA=this.fpsN=0}}
  if(!this.dead)requestAnimationFrame(n=>this.loop(n))},
 hurt(p,d){if(p.inv>0||p.dead)return;p.hp-=d;p.inv=.5;if(p==this.p)this.shake=12;this.snd('hurt');this.burst(p.x,p.y,'#f33',14);
  if(p.hp<=0){p.dead=1;if(this.ps.every(q=>q.dead)){this.end(this.score,this.wave);if(this.net)Net.send({t:'over',s:this.score,w:this.wave})}}},
 end(s,w){this.dead=true;this.score=s;this.wave=w;Audio_.sfx('over');Audio_.stop();const nb=s>Store.d.best;if(nb){Store.d.best=s;Store.save()}
  document.getElementById('overS').textContent=`Puntos: ${s} · Oleada ${w}${nb?' · ¡NUEVO RÉCORD!':''}`;document.getElementById('pname').value=Store.d.name||'';
  document.getElementById('saveScore').hidden=false;document.getElementById('again').hidden=this.net=='client';document.getElementById('pause').hidden=true;document.getElementById('over').hidden=false},
 update(dt){if(this.net=='client')this.updC(dt);else this.updH(dt);
  for(const q of this.pt){q.x+=q.vx*dt;q.y+=q.vy*dt;q.l-=dt}this.pt=this.pt.filter(q=>q.l>0);this.shake*=.88;this.hud()},
 hud(){const p=this.p;document.getElementById('hp').style.width=Math.max(0,p.hp)+'%';document.getElementById('score').textContent=this.score;document.getElementById('weapon').textContent='🔫 '+this.WEAPONS[this.myw].n+(p.rapid>0?' ⚡':'')},
 // Simulación (solo y anfitrión)
 updH(dt){const W=this.W,H=this.H,K=Store.d.keys,me=this.p,fz=this.paused,ps=this.ps,al=ps.filter(p=>!p.dead);
  me.in={dx:fz?0:(this.keys[K.right]?1:0)-(this.keys[K.left]?1:0),dy:fz?0:(this.keys[K.down]?1:0)-(this.keys[K.up]?1:0),a:Math.atan2(this.mouse.y-me.y,this.mouse.x-me.x),f:!fz&&(this.mouse.down||this.keys[K.fire])?1:0,d:this.dashQ?1:0,w:this.myw};this.dashQ=0;
  for(const p of al){const i=p.in,l=Math.hypot(i.dx,i.dy)||1;
   if(i.d){i.d=0;if(p.dashCd<=0){let x=i.dx,y=i.dy;if(!x&&!y){x=Math.cos(p.ang);y=Math.sin(p.ang)}const q=Math.hypot(x,y);p.vx=x/q*900;p.vy=y/q*900;p.dashT=.18;p.inv=.3;p.dashCd=1.2;this.snd('dash')}}
   if(p.dashT>0)p.dashT-=dt;else{p.vx+=(i.dx/l*260-p.vx)*Math.min(1,dt*12);p.vy+=(i.dy/l*260-p.vy)*Math.min(1,dt*12)}
   p.x=Math.max(16,Math.min(W-16,p.x+p.vx*dt));p.y=Math.max(16,Math.min(H-16,p.y+p.vy*dt));p.ang=i.a;p.weapon=Math.max(0,Math.min(2,i.w|0));
   p.cd-=dt;p.inv-=dt;p.dashCd-=dt;p.rapid-=dt;if(i.f&&p.cd<=0)this.fire(p);
   if(Store.d.quality!='low'&&Math.abs(p.vx)+Math.abs(p.vy)>50)this.pt.push({x:p.x,y:p.y,vx:0,vy:0,l:.3,col:this.sk(p).trail,trail:1})}
  if(this.queue>0){this.spT-=dt;if(this.spT<=0){this.spawn();this.queue--;this.spT=Math.max(.25,1-this.wave*.05)}}
  else if(!this.en.length){this.score+=this.wave*50;this.nextWave()}
  for(const b of this.b){b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt}this.b=this.b.filter(b=>b.l>0&&b.x>0&&b.y>0&&b.x<W&&b.y<H);
  for(const b of this.eb){b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;for(const p of al)if(b.l>0&&!p.dead&&Math.hypot(b.x-p.x,b.y-p.y)<18){b.l=0;this.hurt(p,10*Math.min(1.5,this.mult))}}this.eb=this.eb.filter(b=>b.l>0);
  for(const e of this.en){let tp=al[0],d=1e9;for(const p of al){const q=Math.hypot(p.x-e.x,p.y-e.y);if(q<d){d=q;tp=p}}if(!tp)break;const a=Math.atan2(tp.y-e.y,tp.x-e.x);
   if(e.type=='shooter'&&d<280){e.x-=Math.cos(a)*e.sp*dt*.5}else{e.x+=Math.cos(a)*e.sp*dt;e.y+=Math.sin(a)*e.sp*dt}
   if(e.type=='boss'){e.fire-=dt;if(e.fire<=0){e.fire=2.2;for(let i=0;i<14;i++){const q=i*6.283/14+this.t;this.eb.push({x:e.x,y:e.y,vx:Math.cos(q)*220,vy:Math.sin(q)*220,l:5})}}}
   if(e.type=='shooter'){e.fire-=dt;if(e.fire<=0){e.fire=2;this.eb.push({x:e.x,y:e.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,l:4})}}
   if(d<e.r+14)this.hurt(tp,e.type=='boss'?30:e.type=='tank'?20:12);
   for(const b of this.b)if(b.l>0&&Math.hypot(b.x-e.x,b.y-e.y)<e.r+4){b.l=0;e.hp--;this.burst(b.x,b.y,e.col,3,120);this.snd('hit')}
   if(e.hp<=0){this.score+=e.sc;this.burst(e.x,e.y,e.col,26,300);this.shake=Math.max(this.shake,6);this.snd('boom');if(Math.random()<.14)this.pk.push({x:e.x,y:e.y,k:Math.random()<.6?'hp':'rf',l:9})}}
  this.en=this.en.filter(e=>e.hp>0);
  for(const k of this.pk){k.l-=dt;for(const p of al)if(k.l>0&&!p.dead&&Math.hypot(k.x-p.x,k.y-p.y)<26){k.l=0;this.snd('pick');if(k.k=='hp')p.hp=Math.min(100,p.hp+25);else p.rapid=6}}this.pk=this.pk.filter(k=>k.l>0);
  if(this.net=='host'){this.sendT-=dt;if(this.sendT<=0){this.sendT=.05;this.sendSnap()}}},
 sendSnap(){const r=Math.round,v=b=>[r(b.x),r(b.y),r(b.vx),r(b.vy)];
  Net.send({t:'s',w:this.wave,sc:this.score,p:this.ps.map(p=>[p.id,r(p.x),r(p.y),+p.ang.toFixed(2),Math.max(0,r(p.hp)),p.inv>0?1:0,p.rapid>0?1:0,p.weapon,p.skin,p.name,p.dead]),
   e:this.en.map(e=>[e.id,r(e.x),r(e.y),e.type,e.hp,e.maxhp,e.r,e.col]),b:this.b.map(v),eb:this.eb.map(v),pk:this.pk.map(k=>[r(k.x),r(k.y),k.k]),ev:this.ev,sn:[...this.snd_]});this.ev=[];this.snd_.clear()},
 // Cliente: envía su control y recibe el estado
 updC(dt){const K=Store.d.keys,p=this.p,fz=this.paused;p.ang=Math.atan2(this.mouse.y-p.y,this.mouse.x-p.x);
  this.sendT-=dt;if(this.sendT<=0){this.sendT=1/30;Net.send({t:'i',dx:fz?0:(this.keys[K.right]?1:0)-(this.keys[K.left]?1:0),dy:fz?0:(this.keys[K.down]?1:0)-(this.keys[K.up]?1:0),a:+p.ang.toFixed(3),f:!fz&&(this.mouse.down||this.keys[K.fire])?1:0,d:this.dashQ&&!fz?1:0,w:this.myw});this.dashQ=0}
  const k=Math.min(1,dt*14);for(const o of this.ps.concat(this.en)){const mv=Math.abs(o.tx-o.x)+Math.abs(o.ty-o.y);o.x+=(o.tx-o.x)*k;o.y+=(o.ty-o.y)*k;
   if(o.skin&&!o.dead&&mv>3&&Store.d.quality!='low')this.pt.push({x:o.x,y:o.y,vx:0,vy:0,l:.3,col:this.sk(o).trail,trail:1})}
  for(const b of this.b.concat(this.eb)){b.x+=b.vx*dt;b.y+=b.vy*dt}},
 snap(m){if(!this.run||this.net!='client'||this.dead)return;
  const op=Object.fromEntries(this.ps.map(p=>[p.id,p])),oe=Object.fromEntries(this.en.map(e=>[e.id,e])),b=a=>({x:a[0],y:a[1],vx:a[2],vy:a[3]});
  this.ps=m.p.map(a=>{const o=op[a[0]]||{x:a[1],y:a[2]};return{id:a[0],x:o.x,y:o.y,tx:a[1],ty:a[2],ang:a[3],hp:a[4],inv:a[5],rapid:a[6],weapon:a[7],skin:a[8],name:a[9],dead:a[10]}});
  this.en=m.e.map(a=>{const o=oe[a[0]]||{x:a[1],y:a[2]};return{id:a[0],x:o.x,y:o.y,tx:a[1],ty:a[2],type:a[3],hp:a[4],maxhp:a[5],r:a[6],col:a[7]}});
  this.b=m.b.map(b);this.eb=m.eb.map(b);this.pk=m.pk.map(a=>({x:a[0],y:a[1],k:a[2]}));
  this.p=this.ps.find(p=>p.id==Net.id)||this.p;this.p.weapon=this.myw;this.score=m.sc;
  if(m.w!=this.wave){this.wave=m.w;document.getElementById('wave').textContent='OLEADA '+m.w}
  for(const e of m.ev){if(e[0]=='bn')this.banner(e[1]);else this.burst(e[1],e[2],e[3],e[4],e[5])}for(const s of m.sn)Audio_.sfx(s)},
 draw(){const c=this.c,W=this.W,H=this.H,cw=this.cv.width,ch=this.cv.height,hi=Store.d.quality=='high',q=Store.d.quality;
  c.fillStyle='#02121a';c.fillRect(0,0,cw,ch);c.save();c.translate(this.ox,this.oy);c.scale(this.sc,this.sc);if(this.net){c.beginPath();c.rect(0,0,W,H);c.clip()}
  c.fillStyle='#03222d';c.fillRect(0,0,W,H);const sh=this.shake*Store.d.shake/100;if(sh>.3)c.translate((Math.random()-.5)*sh*2,(Math.random()-.5)*sh*2);
  c.strokeStyle='#0b4152';c.lineWidth=1;c.beginPath();const o=(this.t*20)%50;for(let x=-o;x<W;x+=50){c.moveTo(x,0);c.lineTo(x,H)}for(let y=-o;y<H;y+=50){c.moveTo(0,y);c.lineTo(W,y)}c.stroke();
  for(const q2 of this.pt){c.globalAlpha=Math.max(0,q2.l*2);c.fillStyle=q2.col;const s=q2.trail?10:3;c.fillRect(q2.x-s/2,q2.y-s/2,s,s)}c.globalAlpha=1;
  for(const k of this.pk){c.fillStyle=k.k=='hp'?'#3f8':'#fd3';if(hi){c.shadowColor=c.fillStyle;c.shadowBlur=16}c.font='24px sans-serif';c.textAlign='center';c.fillText(k.k=='hp'?'❤':'⚡',k.x,k.y+8);c.shadowBlur=0}
  c.fillStyle='#ff0';if(hi){c.shadowColor='#ff0';c.shadowBlur=12}for(const b of this.b){c.beginPath();c.arc(b.x,b.y,4,0,7);c.fill()}
  c.fillStyle='#f55';if(hi)c.shadowColor='#f00';for(const b of this.eb){c.beginPath();c.arc(b.x,b.y,6,0,7);c.fill()}c.shadowBlur=0;
  for(const e of this.en){c.fillStyle=e.col;c.strokeStyle='#fff';c.lineWidth=2;if(hi){c.shadowColor=e.col;c.shadowBlur=16}c.beginPath();
   if(e.type=='chaser')c.arc(e.x,e.y,e.r,0,7);else{const n=e.type=='boss'?8:e.type=='tank'?6:4;for(let i=0;i<n;i++){const a=i*6.28/n+this.t;c.lineTo(e.x+Math.cos(a)*e.r,e.y+Math.sin(a)*e.r)}c.closePath()}c.fill();c.stroke();c.shadowBlur=0;
   if(e.maxhp>3){c.fillStyle='#000a';c.fillRect(e.x-e.r,e.y-e.r-10,e.r*2,5);c.fillStyle='#3f8';c.fillRect(e.x-e.r,e.y-e.r-10,e.r*2*Math.max(0,e.hp)/e.maxhp,5)}}
  for(const p of this.ps){c.globalAlpha=p.dead?.25:(p.inv>0&&((this.t*20)|0)%2?.4:1);drawSkin(c,this.sk(p),p.x,p.y,16,p.ang,this.t,hi);c.globalAlpha=1;
   if(this.net&&!p.dead&&p!=this.p){c.fillStyle='#000a';c.fillRect(p.x-18,p.y+24,36,4);c.fillStyle='#3f8';c.fillRect(p.x-18,p.y+24,36*p.hp/100,4)}
   if(this.net||Store.d.showName!==false){c.font='700 14px Roboto,sans-serif';c.textAlign='center';c.fillStyle=p==this.p?'#fff':'#9ff';c.shadowColor='#0ff';c.shadowBlur=hi?8:0;c.fillText(p.name||'Jugador',p.x,p.y-42);c.shadowBlur=0}}
  if(this.p.dead){c.font='700 22px Roboto,sans-serif';c.textAlign='center';c.fillStyle='#fff';c.fillText('💀 Caído: revives en la próxima oleada',W/2,H-90)}
  c.strokeStyle='#fff8';c.lineWidth=1.5;c.beginPath();c.arc(this.mouse.x,this.mouse.y,10,0,7);c.moveTo(this.mouse.x-16,this.mouse.y);c.lineTo(this.mouse.x+16,this.mouse.y);c.moveTo(this.mouse.x,this.mouse.y-16);c.lineTo(this.mouse.x,this.mouse.y+16);c.stroke();
  c.restore();if(q!='low'){const g=c.createRadialGradient(cw/2,ch/2,ch*.4,cw/2,ch/2,ch*.9);g.addColorStop(0,'#0000');g.addColorStop(1,'#000b');c.fillStyle=g;c.fillRect(0,0,cw,ch)}}
};
