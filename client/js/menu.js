// Menú: navegación, ajustes, rebind de teclas, galería de skins, fondo animado
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function go(n){$('#menu').dataset.s=n;$$('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen==n));if(n=='ranking')buildBoard();if(n=='settings'){buildKeys();buildSkins()}if(n=='online')Net.render();}
$$('[data-go]').forEach(b=>b.onclick=()=>{Audio_.init();go(b.dataset.go)});
$('#best').textContent=Store.d.best;
// Pestañas
$$('[data-tab]').forEach(b=>b.onclick=()=>{$$('[data-tab]').forEach(x=>x.classList.toggle('on',x==b));$$('.tab').forEach(t=>t.classList.toggle('on',t.id=='tab-'+b.dataset.tab))});
// Teclas
let waiting=null;
function pretty(c){return c.replace('Key','').replace('Digit','').replace('Arrow','↔ ')}
function buildKeys(){const l=$('#keyList');l.innerHTML='';for(const a in KEY_LABELS){const r=document.createElement('div');r.className='key';r.innerHTML=`<span>${KEY_LABELS[a]}</span>`;const b=document.createElement('button');b.textContent=pretty(Store.d.keys[a]);
 b.onclick=()=>{waiting=a;b.textContent='Pulsa una tecla…';b.classList.add('wait')};l.appendChild(r);r.appendChild(b)}}
addEventListener('keydown',e=>{if(!waiting)return;e.preventDefault();for(const a in Store.d.keys)if(Store.d.keys[a]==e.code)Store.d.keys[a]=Store.d.keys[waiting];Store.d.keys[waiting]=e.code;waiting=null;Store.save();buildKeys()},true);
$('#resetKeys').onclick=()=>{Store.d.keys={...DEFAULT_KEYS};Store.save();buildKeys()};
// Ajustes
const bindR=(id,k,cb)=>{const e=$('#'+id);e.value=Store.d[k];e.oninput=()=>{Store.d[k]=e.value;Store.save();cb&&cb()}};
bindR('music','music',()=>Audio_.vol());bindR('sfx','sfx',()=>{Audio_.vol();Audio_.sfx('shoot')});bindR('particles','particles');bindR('shake','shake');bindR('quality','quality');bindR('difficulty','difficulty');
const crt=$('#crtOn');crt.checked=Store.d.crt;$('#crt').classList.toggle('on',crt.checked);crt.onchange=()=>{Store.d.crt=crt.checked;Store.save();$('#crt').classList.toggle('on',crt.checked)};
$('#fps').checked=Store.d.fps;$('#fps').onchange=e=>{Store.d.fps=e.target.checked;Store.save();if(!e.target.checked)$('#fpsBox').textContent=''};
$('#full').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
// Skins
let sel=Store.d.skin,pv=$('#preview').getContext('2d');
function buildSkins(){const g=$('#skinGrid');g.innerHTML='';SKINS.forEach(s=>{const d=document.createElement('div');d.className=`card r-${s.rar}`+(s.id==Store.d.skin?' sel':'');
 const cv=document.createElement('canvas');cv.width=cv.height=56;drawSkin(cv.getContext('2d'),s,28,34,13,-.5,0,false);d.append(cv,s.name);
 d.onmouseenter=()=>{sel=s.id;info()};d.onclick=()=>{Store.d.skin=s.id;Store.save();sel=s.id;Audio_.sfx('pick');buildSkins();info()};g.appendChild(d)});info()}
function info(){const s=SKINS.find(x=>x.id==sel);$('#skinInfo').innerHTML=`<div class="r-${s.rar}"><b>${s.name}</b><br><span class="rar">★ ${s.rar}</span><br><small>${s.id==Store.d.skin?'✔ Equipada':'Click para equipar'}</small></div>`}
// Fondo animado + preview
const bg=$('#bg'),bc=bg.getContext('2d');let stars=[];function rb(){bg.width=innerWidth;bg.height=innerHeight;stars=Array.from({length:120},()=>({x:Math.random()*bg.width,y:Math.random()*bg.height,s:Math.random()*2+.5,c:Math.random()<.5?'#0ff':'#f0a'}))}rb();addEventListener('resize',rb);
function anim(t){t/=1000;if(!$('#menu').hidden)Demo.frame(t);
 if($('[data-screen=settings]').classList.contains('active')&&$('#tab-skins').classList.contains('on')){pv.clearRect(0,0,260,260);const s=SKINS.find(x=>x.id==sel);drawSkin(pv,s,130,140,54,t*1.2,t,true)}requestAnimationFrame(anim)}requestAnimationFrame(anim);
// Partida
Game.init();
function begin(m){if(!m){Net.leave();Store.d.name=($('#nick').value.trim()||'Jugador').slice(0,14);Store.save()}$('#menu').hidden=true;$('#over').hidden=true;$('#pause').hidden=true;$('#game').hidden=false;$('#hud').hidden=false;bg.style.display='none';Audio_.play();Audio_.vol();Game.start(m,Net.roster)}
function toMenu(){Game.stop();Net.leave();$('#menu').hidden=false;$('#over').hidden=true;$('#pause').hidden=true;$('#game').hidden=true;$('#hud').hidden=true;bg.style.display='';$('#best').textContent=Store.d.best;go('main')}
$('#again').onclick=()=>Net.on&&Net.host?Net.startGame():begin();$('#toMenu').onclick=toMenu;$('#quit').onclick=toMenu;$('#resume').onclick=()=>Game.pause(false);

// Ranking
async function buildBoard(){const l=await Api.get();$('#rankMode').textContent='Fuente: '+Api.mode;
 $('#board').innerHTML='<table class="board"><tr><th>#</th><th>Jugador</th><th>Puntos</th><th>Oleada</th></tr>'+(l.length?l.map((s,i)=>`<tr><td>${i+1}</td><td>${s.name.replace(/[<>&]/g,'')}</td><td>${s.points}</td><td>${s.wave}</td></tr>`).join(''):'<tr><td colspan=4>Aún no hay puntuaciones</td></tr>')+'</table>'}
$('#saveScore').onclick=async()=>{const n=($('#pname').value.trim()||'Anónimo').slice(0,12);Store.d.name=n;Store.save();$('#saveScore').hidden=true;await Api.submit(n,Game.score,Game.wave);toMenu();go('ranking')};

// Fondo: un bot juega solo (apunta y dispara a enemigos) detrás del menú
const Demo={p:{x:0,y:0,a:0,cd:0,tx:0,ty:0,tt:0},e:[],b:[],pt:[],last:0,sp:0,
 frame(t){const W=bg.width,H=bg.height,dt=Math.min(.05,t-this.last||.016);this.last=t;const p=this.p,sk=SKINS.find(s=>s.id==Store.d.skin)||SKINS[0];
  if(!p.x){p.x=W/2;p.y=H/2;p.tx=p.x;p.ty=p.y}
  this.sp-=dt;if(this.sp<=0&&this.e.length<9){this.sp=.9;const k=Math.random()*4|0;this.e.push({x:k<2?(k?W+30:-30):Math.random()*W,y:k>=2?(k==3?H+30:-30):Math.random()*H,hp:2,r:14,col:Math.random()<.3?'#ffb13a':'#ff3a6a'})}
  p.tt-=dt;if(p.tt<=0){p.tt=1.5+Math.random()*2;p.tx=W*.1+Math.random()*W*.8;p.ty=H*.1+Math.random()*H*.8}
  p.x+=(p.tx-p.x)*dt*.8;p.y+=(p.ty-p.y)*dt*.8;
  let n=null,nd=1e9;for(const e of this.e){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){nd=d;n=e}}
  if(n){const a=Math.atan2(n.y-p.y,n.x-p.x);p.a+=Math.atan2(Math.sin(a-p.a),Math.cos(a-p.a))*Math.min(1,dt*8);p.cd-=dt;
   if(p.cd<=0&&nd<650){p.cd=.18;const q=p.a+(Math.random()-.5)*.08;this.b.push({x:p.x+Math.cos(p.a)*30,y:p.y+Math.sin(p.a)*30,vx:Math.cos(q)*750,vy:Math.sin(q)*750,l:1})}}
  for(const e of this.e){const a=Math.atan2(p.y-e.y,p.x-e.x);e.x+=Math.cos(a)*70*dt;e.y+=Math.sin(a)*70*dt;if(Math.hypot(p.x-e.x,p.y-e.y)<30)e.hp=0}
  for(const b of this.b){b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;for(const e of this.e)if(b.l>0&&Math.hypot(b.x-e.x,b.y-e.y)<e.r+4){b.l=0;e.hp--}}
  for(const e of this.e)if(e.hp<=0)for(let i=0;i<14;i++){const a=Math.random()*6.28,s=Math.random()*220;this.pt.push({x:e.x,y:e.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:.6,col:e.col})}
  this.e=this.e.filter(e=>e.hp>0);this.b=this.b.filter(b=>b.l>0);for(const q of this.pt){q.x+=q.vx*dt;q.y+=q.vy*dt;q.l-=dt}this.pt=this.pt.filter(q=>q.l>0);
  bc.fillStyle='#02222d';bc.fillRect(0,0,W,H);bc.fillStyle='#0a3d4d';for(let x=25;x<W;x+=50)for(let y=25;y<H;y+=50)bc.fillRect(x-2,y-2,4,4);
  for(const q of this.pt){bc.globalAlpha=Math.max(0,q.l*2);bc.fillStyle=q.col;bc.fillRect(q.x-1.5,q.y-1.5,3,3)}bc.globalAlpha=1;
  bc.fillStyle='#ff0';bc.shadowColor='#ff0';bc.shadowBlur=10;for(const b of this.b){bc.beginPath();bc.arc(b.x,b.y,4,0,7);bc.fill()}
  for(const e of this.e){bc.fillStyle=e.col;bc.shadowColor=e.col;bc.strokeStyle='#fff';bc.lineWidth=2;bc.beginPath();bc.arc(e.x,e.y,e.r,0,7);bc.fill();bc.stroke()}bc.shadowBlur=0;
  drawSkin(bc,sk,p.x,p.y,16,p.a,t,true);
  bc.font='700 14px Roboto,sans-serif';bc.textAlign='center';bc.fillStyle='#fff';bc.fillText(($('#nick').value.trim()||'Jugador'),p.x,p.y-42);
  bc.fillStyle='rgba(2,34,45,.35)';bc.fillRect(0,0,W,H)}};
Net.bind();
// Nombre, ojo, Enter para jugar
$('#nick').value=Store.d.name||'';
const eye=$('#eye');eye.classList.toggle('off',Store.d.showName===false);eye.onclick=()=>{Store.d.showName=Store.d.showName===false;Store.save();eye.classList.toggle('off',Store.d.showName===false);$('#nick').focus()};
$('#press').onclick=()=>{Audio_.init();begin()};
addEventListener('keydown',e=>{if(e.key=='Enter'&&!$('#menu').hidden&&$('#loader').hidden&&$('[data-screen=main]').classList.contains('active'))begin()});
// Pantalla de carga
(function(){const L=$('#loader'),f=$('#lfill'),t=$('#ltxt'),m=['Cargando armas…','Encendiendo neones…','Despertando enemigos…','Afilando balas…','¡Listo!'];let v=0;
 const iv=setInterval(()=>{v=Math.min(100,v+Math.random()*7+2);f.style.width=v+'%';t.textContent=m[Math.min(4,v/21|0)];
  if(v>=100){clearInterval(iv);setTimeout(()=>{L.classList.add('out');setTimeout(()=>{L.hidden=true;$('#nick').focus();Net.auto()},600)},300)}},90)})();
