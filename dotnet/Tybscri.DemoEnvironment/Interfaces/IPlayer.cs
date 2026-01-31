namespace Tybscri.DemoEnvironment;

/// <summary>
/// The player character
/// </summary>
public interface IPlayer
{
    string Name { get; }
    double Health { get; }
    double MaxHealth { get; }
    bool IsAlive { get; }
    ILocation CurrentLocation { get; }

    void TakeDamage(double amount);
    void Heal(double amount);
    void Damage(IEnemy target, double amount);
    void MoveTo(ILocation location);

    void OnDamaged(Action<IDamageEvent> handler);
    void OnInterval(double seconds, Action handler);
}
