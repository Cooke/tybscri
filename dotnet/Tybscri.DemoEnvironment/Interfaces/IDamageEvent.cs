namespace Tybscri.DemoEnvironment;

/// <summary>
/// Event fired when damage is dealt
/// </summary>
public interface IDamageEvent
{
    double Amount { get; }
    bool IsCritical { get; }
}
