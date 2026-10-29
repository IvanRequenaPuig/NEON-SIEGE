// Ranking: usa el servidor C# si está activo (/api/scores); si no, cae a localStorage
const Api={mode:'Local (navegador)',
 async get(){try{const r=await fetch('/api/scores');if(!r.ok)throw 0;this.mode='Servidor C#';return await r.json()}catch(e){this.mode='Local (navegador)';return JSON.parse(localStorage.getItem('ns_scores')||'[]')}},
 async submit(name,points,wave){try{const r=await fetch('/api/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,points,wave})});if(!r.ok)throw 0}
  catch(e){const l=JSON.parse(localStorage.getItem('ns_scores')||'[]');l.push({name,points,wave});l.sort((a,b)=>b.points-a.points);localStorage.setItem('ns_scores',JSON.stringify(l.slice(0,10)))}}};
