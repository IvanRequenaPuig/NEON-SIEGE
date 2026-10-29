// Ajustes y progreso guardados en localStorage (sin servidor ni BD)
const DEFAULT_KEYS={up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',dash:'Space',fire:'KeyJ',weapon:'KeyQ',pause:'Escape'};
const KEY_LABELS={up:'Arriba',down:'Abajo',left:'Izquierda',right:'Derecha',dash:'Esquivar',fire:'Disparar',weapon:'Cambiar arma',pause:'Pausa'};
const Store={
 d:{keys:{...DEFAULT_KEYS},music:50,sfx:70,quality:'high',particles:80,shake:60,crt:false,fps:false,difficulty:1,skin:'neo',best:0,name:'',showName:true},
 load(){try{const s=JSON.parse(localStorage.getItem('neonsiege'));if(s)this.d={...this.d,...s,keys:{...DEFAULT_KEYS,...s.keys}}}catch(e){}},
 save(){try{localStorage.setItem('neonsiege',JSON.stringify(this.d))}catch(e){}}
};Store.load();
