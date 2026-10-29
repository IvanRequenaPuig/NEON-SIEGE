// Audio 100% procedural (WebAudio): sin archivos externos
const Audio_={ctx:null,mus:null,sfxG:null,timer:null,step:0,
 init(){if(this.ctx)return;this.ctx=new(window.AudioContext||window.webkitAudioContext)();
  this.mus=this.ctx.createGain();this.sfxG=this.ctx.createGain();this.mus.connect(this.ctx.destination);this.sfxG.connect(this.ctx.destination);this.vol()},
 vol(){if(!this.ctx)return;this.mus.gain.value=Store.d.music/100*.35;this.sfxG.gain.value=Store.d.sfx/100*.5},
 tone(f,d,type,dest,v=.5,slide=0){const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,c.currentTime);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),c.currentTime+d);g.gain.setValueAtTime(v,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+d);
  o.connect(g);g.connect(dest);o.start();o.stop(c.currentTime+d)},
 sfx(n){if(!this.ctx)return;const s=this.sfxG;
  ({shoot:()=>this.tone(700,.1,'square',s,.25,-500),hit:()=>this.tone(200,.12,'sawtooth',s,.3,-120),boom:()=>this.tone(120,.3,'sawtooth',s,.5,-90),
  hurt:()=>this.tone(150,.35,'square',s,.6,-100),pick:()=>this.tone(600,.2,'sine',s,.4,500),dash:()=>this.tone(300,.2,'triangle',s,.4,600),wave:()=>this.tone(300,.4,'square',s,.3,300),over:()=>this.tone(300,1,'sawtooth',s,.5,-250)})[n]?.()},
 play(){this.init();this.ctx.resume();this.stop();const bass=[55,55,65.4,49],lead=[440,523,659,523,587,494,392,494];
  this.timer=setInterval(()=>{const i=this.step++;this.tone(bass[(i>>2)%4],.22,'sawtooth',this.mus,.5);if(i%2)this.tone(lead[i%8]*(i%16>7?1.5:1),.15,'triangle',this.mus,.18);if(i%4==0)this.tone(90,.12,'sine',this.mus,.8,-60)},170)},
 stop(){clearInterval(this.timer)}};
