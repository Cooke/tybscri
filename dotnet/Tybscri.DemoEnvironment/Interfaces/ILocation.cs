namespace Tybscri.DemoEnvironment;

/// <summary>
/// A location in the game world
/// </summary>
public interface ILocation
{
    string Name { get; }
    string Description { get; }
    List<IEnemy> Enemies { get; }
    List<ILocation> ConnectedLocations { get; }
}
