// See https://aka.ms/new-console-template for more information

using System.Text.Json;
using Tybscri;

var compiler = Compiler.Create<EnvironmentGlobals>();
Console.WriteLine(JsonSerializer.Serialize(compiler.Environment,
    new JsonSerializerOptions(JsonSerializerDefaults.Web) { WriteIndented = true }));

interface Npc
{
    public string Name { get; }

    public void Say(string message);

    public void Attack(Player player);
}

interface AttackedEvent
{
    Npc Attacker { get; }
}

interface Player
{
    public string Name { get; }

    public void OnAttacked(Action<AttackedEvent> handler);
}

class EnvironmentGlobals
{
    public List<Npc> Npcs { get; }
    
    public Player Player { get; }
}