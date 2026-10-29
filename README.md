# 🔫 NEON SIEGE
Shooter top-down de supervivencia por oleadas, en el navegador. Sobrevive a hordas de enemigos neón, derrota a los jefes y entra en el ranking.

## ▶ Cómo ejecutarlo
**Opción A (solo juego, sin online):** abre `client/index.html` en el navegador. El ranking se guarda en tu navegador (localStorage).
**Opción B (con backend C#):** instala el [.NET 8 SDK](https://dotnet.microsoft.com/download) y ejecuta:
```
cd server
dotnet run
```
Abre http://localhost:5000. El ranking se guarda en `server/scores.json` (sin base de datos ni servicios externos).

## 👥 Jugar con amigos online (co-op, hasta 4)
Requiere la **Opción B** (el servidor gestiona las salas).
1. Pulsa el icono de **enviar ✈** (a la izquierda de la ⚙) o ve a *Jugar con amigos*: se crea una sala y se comparte/copia el enlace de invitación.
2. Tus amigos abren el enlace (`?room=CÓDIGO`) o escriben el código en *Unirse*, y eligen su nombre y skin.
3. El anfitrión pulsa **EMPEZAR**. Se puede entrar con la partida ya empezada.
- Más jugadores = más enemigos y jefes con más vida. Dificultad = la del anfitrión.
- Si caes, **revives en la siguiente oleada** (con 50 de vida). Si caen todos, fin de la partida.
- Para jugar por Internet, expón el puerto 5000 (túnel `cloudflared`/`ngrok`, o despliega en un hosting con .NET 8; puerto vía variable `PORT`). El enlace usa la dirección pública desde la que abras el juego.

## 🎮 Controles (todos reasignables en Ajustes → Controles)
| Acción | Tecla por defecto |
|---|---|
| Mover | W A S D |
| Apuntar | Ratón |
| Disparar | Click izquierdo (mantener) o **J** |
| Cambiar arma | **Q** o teclas **1 / 2 / 3** |
| Esquivar (dash, invulnerable un instante) | Espacio |
| Pausa | Esc |

## 🔫 Armas
1. **Pistola:** equilibrada y precisa.
2. **Escopeta:** 7 perdigones, corto alcance, muy potente de cerca.
3. **Ametralladora:** cadencia altísima con algo de dispersión.

## 👾 Enemigos
- **Perseguidor (rosa):** corre hacia ti.
- **Tirador (naranja):** mantiene la distancia y dispara.
- **Tanque (morado):** lento y con mucha vida.
- **JEFE (rojo):** cada 5 oleadas. Mucha vida y lanza ráfagas de balas en círculo.

## ❤ Objetos
- ❤ Recupera 25 de vida.
- ⚡ Cadencia de disparo aumentada durante 6 s.

## 📋 Menú
- **Jugar:** elige dificultad (Fácil, Normal, Difícil, Pesadilla).
- **Ranking:** top 10 de puntuaciones.
- **Skins:** 10 skins con rareza (Común, Raro, Épico, Legendario), vista previa giratoria y sombreros/estelas. Se equipan con click.
- **Ajustes:**
  - Controles: cambiar teclas, restaurar.
  - Audio: volumen de música y efectos (audio generado por código).
  - Gráficos: calidad (Baja/Media/Alta con brillos), partículas, sacudida de pantalla, efecto CRT, FPS, pantalla completa.
- **Cómo jugar:** resumen de controles.

## 📁 Estructura
```
neon-siege/
├── README.md
├── client/               ← el juego (HTML + CSS + JS separados)
│   ├── index.html
│   ├── css/style.css     estilos del menú, HUD y pantallas
│   └── js/
│       ├── storage.js    ajustes y récord (localStorage)
│       ├── api.js        ranking: servidor C# o local
│       ├── audio.js      música y efectos procedurales (WebAudio)
│       ├── skins.js      catálogo y dibujado de skins
│       ├── online.js     salas, lobby, invitación y red (WebSocket)
│       ├── game.js       motor: movimiento, armas, enemigos, jefes, dibujado
│       └── menu.js       navegación, ajustes, rebind de teclas, skins, ranking
└── server/               ← backend en C# (ASP.NET Core Minimal API)
    ├── NeonSiege.Server.csproj
    └── Program.cs        sirve el juego + API /api/scores (JSON en disco)
```
## 🔌 API del servidor
- `GET /api/scores` → top 10.
- `WS /ws/{código}` (`?host=1` para crear la sala): relé de la sala online.
- `POST /api/scores` con `{ "name": "...", "points": 123, "wave": 3 }`.
