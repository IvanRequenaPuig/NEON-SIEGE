// Online con amigos: sala por WebSocket (/ws/CÓDIGO). El anfitrión simula la partida; los demás envían su control y reciben el estado.
const Net={ws:null,on:false,host:false,id:-1,code:'',roster:[],pend:0,
 name(){return(Store.d.name||'Jugador').slice(0,14)},
 ok(){return location.protocol!='file:'},
 url(){return location.origin+location.pathname+'?room='+this.code},
 ui(m){const e=document.getElementById('lobbyMsg');if(e)e.textContent=m},
 send(m){if(this.ws&&this.ws.readyState==1)this.ws.send(typeof m=='string'?m:JSON.stringify(m))},
 to(id,m){this.send(id+'|'+JSON.stringify(m))},
 create(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let c='';for(let i=0;i<5;i++)c+=A[Math.random()*A.length|0];this.open(c,true)},
 open(code,host){if(!this.ok()){this.ui('Para jugar online abre el juego desde el servidor (dotnet run).');return}
  this.leave();this.code=code;this.host=host;this.ui('Conectando…');
  const ws=this.ws=new WebSocket((location.protocol=='https:'?'wss://':'ws://')+location.host+'/ws/'+code+(host?'?host=1':''));
  ws.onmessage=e=>this.recv(e.data);
  ws.onerror=()=>this.ui('No se pudo conectar con el servidor');
  ws.onclose=()=>{if(this.ws!==ws)return;const g=Game.run&&Game.net;this.leave();this.ui('Conexión cerrada');if(g){toMenu();go('online')}}},
 leave(){const w=this.ws;this.ws=null;this.on=false;this.host=false;this.roster=[];this.pend=0;if(w)try{w.close()}catch(e){}this.render()},
 recv(d){let id=0,m;try{if(this.host){const i=d.indexOf('|');id=+d.slice(0,i);m=JSON.parse(d.slice(i+1))}else m=JSON.parse(d)}catch(e){return}const t=m.t;
  if(t=='hello'){this.id=m.id;this.on=true;this.roster=[{id:m.id,name:this.name(),skin:Store.d.skin}];this.ui('');if(!m.host)this.send({t:'hi',name:this.name(),skin:Store.d.skin});this.render();if(m.host&&this.pend){this.pend=0;this.share()}}
  else if(t=='err'){this.leave();this.ui(m.m||'Sala no disponible')}
  else if(t=='closed'){const g=Game.run&&Game.net;this.leave();this.ui('El anfitrión cerró la sala');if(g){toMenu();go('online')}}
  else if(this.host){
   if(t=='hi'){const name=String(m.name||'Jugador').slice(0,14),r=this.roster.find(x=>x.id==id);if(r){r.name=name;r.skin=m.skin}else this.roster.push({id,name,skin:m.skin});
    this.sync();const gp=Game.run&&Game.ps.find(p=>p.id==id);if(gp)gp.name=name;else if(Game.run&&!Game.dead&&Game.net=='host'){Game.addP(id,name,m.skin);this.to(id,{t:'start'})}}
   else if(t=='leave'){this.roster=this.roster.filter(x=>x.id!=id);Game.drop(id);this.sync()}
   else if(t=='i')Game.input(id,m)}
  else if(t=='lobby'){this.roster=m.r;this.render()}
  else if(t=='start'){if(!Game.run||Game.dead)begin('client')}
  else if(t=='s')Game.snap(m)
  else if(t=='over')Game.end(m.s,m.w)},
 sync(){this.send({t:'lobby',r:this.roster});this.render()},
 rename(){if(!this.on)return;const r=this.roster.find(x=>x.id==this.id);if(r)r.name=this.name();if(this.host){this.sync();const p=Game.run&&Game.ps.find(x=>x.id==0);if(p)p.name=this.name()}else this.send({t:'hi',name:this.name(),skin:Store.d.skin});this.render()},
 startGame(){if(!this.host)return;this.send({t:'start'});begin('host')},
 async share(){const u=this.url();
  if(navigator.share){try{await navigator.share({title:'NEON SIEGE',text:'¡Únete a mi partida de NEON SIEGE!',url:u});return}catch(e){if(e.name=='AbortError')return}}
  try{await navigator.clipboard.writeText(u);this.ui('✔ Enlace copiado. Pégalo en WhatsApp, Discord, etc.')}catch(e){this.ui('Copia este enlace: '+u)}},
 invite(){go('online');if(this.on)this.share();else{this.pend=1;this.create()}},
 auto(){const c=new URLSearchParams(location.search).get('room');if(c&&this.ok()){go('online');this.open(c.toUpperCase().slice(0,5),false)}},
 render(){const on=this.on;$('#lobbyOff').hidden=on;$('#lobbyOn').hidden=!on;if(!on)return;
  $('#roomCode').textContent=this.code;$('#roomLink').value=this.url();$('#startOnline').hidden=!this.host;$('#waitHost').hidden=this.host;
  $('#lobbyList').innerHTML=this.roster.map(r=>`<div class="pl"><canvas width="32" height="32" data-s="${String(r.skin).replace(/\W/g,'')}"></canvas><span>${String(r.name).replace(/[<>&"]/g,'')}${r.id==0?' 👑':''}${r.id==this.id?' (tú)':''}</span></div>`).join('');
  $$('#lobbyList canvas').forEach(cv=>drawSkin(cv.getContext('2d'),SKINS.find(s=>s.id==cv.dataset.s)||SKINS[0],16,19,8,-.5,0,false))},
 bind(){$('#onick').value=Store.d.name||'';$('#onick').oninput=e=>{Store.d.name=e.target.value.slice(0,14);$('#nick').value=Store.d.name;Store.save();this.rename()};
  $('#invite').onclick=()=>{Audio_.init();this.invite()};$('#mkRoom').onclick=()=>this.create();$('#shareBtn').onclick=()=>this.share();$('#startOnline').onclick=()=>this.startGame();
  $('#joinRoom').onclick=()=>{const c=$('#joinCode').value.trim().toUpperCase();if(c)this.open(c,false)};$('#leaveRoom').onclick=()=>{this.leave();this.ui('')};$('#roomLink').onclick=e=>e.target.select()}};
