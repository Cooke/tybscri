// Tybscri Demo Environment - Mini Game Scripting Demo

using System.Text.Json;
using Tybscri;
using Tybscri.DemoEnvironment;

const string ExampleScript = """
    // Demo script showing Tybscri features

    print("=== Player Info ===")
    print(player.name)

    // Iterate over enemies
    print("=== Enemies ===")
    for (enemy in player.currentLocation.enemies) {
        print(enemy.name)
        if (enemy.isAlive) {
            player.damage(enemy, 10)
        }
    }

    // Event handler with trailing lambda
    player.onDamaged {
        print("Player took damage!")
    }

    // Trigger the event
    print("=== Combat ===")
    player.takeDamage(15)

    // Timer callback
    player.onInterval(2) {
        print("Tick!")
    }

    print("=== Done ===")
    """;

var compiler = Compiler.Create<EnvironmentGlobals>();

// --env: Output environment JSON for demo editor
if (args.Contains("--env"))
{
    Console.WriteLine(JsonSerializer.Serialize(compiler.Environment,
        new JsonSerializerOptions(JsonSerializerDefaults.Web) { WriteIndented = true }));
    return;
}

// --script: Output the example script
if (args.Contains("--script"))
{
    Console.WriteLine(ExampleScript);
    return;
}

// Create game world
var town = new Location("Town Square", "The central plaza");
var goblin = new Enemy("Goblin", 60);
var wolf = new Enemy("Wolf", 70);
town.Enemies.Add(goblin);
town.Enemies.Add(wolf);

var globals = new EnvironmentGlobals
{
    Player = new Player("Hero", town),
    Game = new Game(),
    Print = Console.WriteLine
};

// Run the script
Console.WriteLine("--- Running Script ---\n");
compiler.EvaluateScript(ExampleScript, globals);
Console.WriteLine("\n--- Done ---");
