// Servidor C# (ASP.NET Core Minimal API): sirve el juego, guarda el ranking en scores.json y gestiona salas online (WebSocket)
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
app.Urls.Add($"http://0.0.0.0:{Environment.GetEnvironmentVariable("PORT") ?? "5000"}");

var clientDir = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "..", "client"));
var scoresFile = Path.Combine(builder.Environment.ContentRootPath, "scores.json");
var gate = new object();
var files = new PhysicalFileProvider(clientDir);
var rooms = new ConcurrentDictionary<string, Room>();

app.UseWebSockets();
app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = files });
app.UseStaticFiles(new StaticFileOptions { FileProvider = files });

List<Score> Load()
{
    try { return JsonSerializer.Deserialize<List<Score>>(File.ReadAllText(scoresFile)) ?? new(); }
    catch { return new(); }
}

app.MapGet("/api/scores", () => { lock (gate) return Results.Ok(Load().OrderByDescending(s => s.Points).Take(10)); });

app.MapPost("/api/scores", (ScoreIn s) =>
{
    var name = (s.Name ?? "").Trim();
    if (name.Length is 0 or > 12 || s.Points < 0 || s.Points > 1_000_000 || s.Wave < 1 || s.Wave > 500)
        return Results.BadRequest("Puntuación no válida");
    lock (gate)
    {
        var list = Load();
        list.Add(new Score(name, s.Points, s.Wave, DateTime.UtcNow));
        list = list.OrderByDescending(x => x.Points).Take(50).ToList();
        File.WriteAllText(scoresFile, JsonSerializer.Serialize(list));
    }
    return Results.Ok();
});

// Sala online: el peer 0 es el anfitrión. Cliente -> anfitrión: "id|json". Anfitrión -> todos: "json". Anfitrión -> uno: "id|json".
app.Map("/ws/{code}", async (HttpContext ctx, string code) =>
{
    if (!ctx.WebSockets.IsWebSocketRequest) { ctx.Response.StatusCode = 400; return; }
    code = code.ToUpperInvariant();
    if (code.Length is < 3 or > 8) { ctx.Response.StatusCode = 400; return; }
    using var ws = await ctx.WebSockets.AcceptWebSocketAsync();
    var me = new Peer(ws);
    Room? room;
    if (ctx.Request.Query["host"] == "1")
    {
        room = new Room();
        if (!rooms.TryAdd(code, room)) { await me.Send("{\"t\":\"err\",\"m\":\"Ese código ya está en uso\"}"); return; }
        me.Id = 0;
    }
    else
    {
        if (!rooms.TryGetValue(code, out room)) { await me.Send("{\"t\":\"err\",\"m\":\"La sala no existe\"}"); return; }
        if (room.Peers.Count >= 4) { await me.Send("{\"t\":\"err\",\"m\":\"Sala llena (máx. 4)\"}"); return; }
        me.Id = Interlocked.Increment(ref room.Next);
    }
    room.Peers[me.Id] = me;
    await me.Send($"{{\"t\":\"hello\",\"id\":{me.Id},\"host\":{(me.Id == 0 ? "true" : "false")}}}");

    var buf = new byte[8192];
    try
    {
        var open = true;
        while (open && ws.State == WebSocketState.Open)
        {
            using var ms = new MemoryStream();
            WebSocketReceiveResult r;
            do
            {
                r = await ws.ReceiveAsync(buf, CancellationToken.None);
                if (r.MessageType == WebSocketMessageType.Close || ms.Length > 65536) { open = false; break; }
                ms.Write(buf, 0, r.Count);
            } while (!r.EndOfMessage);
            if (!open) break;
            var text = Encoding.UTF8.GetString(ms.ToArray());
            if (me.Id == 0)
            {
                var i = text.IndexOf('|');
                if (i > 0 && char.IsDigit(text[0]) && int.TryParse(text[..i], out var to))
                { if (room.Peers.TryGetValue(to, out var p)) await p.Send(text[(i + 1)..]); }
                else foreach (var p in room.Peers.Values) if (p.Id != 0) await p.Send(text);
            }
            else if (room.Peers.TryGetValue(0, out var host)) await host.Send($"{me.Id}|{text}");
        }
    }
    catch { }

    room.Peers.TryRemove(me.Id, out _);
    if (me.Id == 0)
    {
        rooms.TryRemove(code, out _);
        foreach (var p in room.Peers.Values) { await p.Send("{\"t\":\"closed\"}"); await p.Close(); }
    }
    else if (room.Peers.TryGetValue(0, out var h)) await h.Send($"{me.Id}|{{\"t\":\"leave\"}}");
});

app.Run();

record Score(string Name, int Points, int Wave, DateTime Date);
record ScoreIn(string? Name, int Points, int Wave);

class Room { public ConcurrentDictionary<int, Peer> Peers = new(); public int Next; }

class Peer(WebSocket ws)
{
    public int Id;
    readonly SemaphoreSlim gate = new(1, 1);
    public async Task Send(string s)
    {
        if (ws.State != WebSocketState.Open) return;
        await gate.WaitAsync();
        try { await ws.SendAsync(Encoding.UTF8.GetBytes(s), WebSocketMessageType.Text, true, CancellationToken.None); }
        catch { }
        finally { gate.Release(); }
    }
    public async Task Close() { try { await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "", CancellationToken.None); } catch { } }
}
