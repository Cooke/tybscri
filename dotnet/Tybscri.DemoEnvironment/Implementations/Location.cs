namespace Tybscri.DemoEnvironment;

internal class Location : ILocation
{
    public string Name { get; }
    public string Description { get; }
    public List<IEnemy> Enemies { get; } = [];
    public List<ILocation> ConnectedLocations { get; } = [];

    public Location(string name, string description = "")
    {
        Name = name;
        Description = description;
    }
}
