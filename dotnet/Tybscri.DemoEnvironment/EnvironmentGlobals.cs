namespace Tybscri.DemoEnvironment;

/// <summary>
/// Root object exposing all game systems to scripts
/// </summary>
public class EnvironmentGlobals
{
    public required IPlayer Player { get; init; }
    public required IGame Game { get; init; }
    public required Action<string> Print { get; init; }
}
