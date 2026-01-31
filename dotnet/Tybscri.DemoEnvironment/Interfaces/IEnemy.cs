namespace Tybscri.DemoEnvironment;

/// <summary>
/// An enemy character
/// </summary>
public interface IEnemy
{
    string Name { get; }
    double Health { get; }
    double MaxHealth { get; }
    bool IsAlive { get; }

    void TakeDamage(double amount);
}
