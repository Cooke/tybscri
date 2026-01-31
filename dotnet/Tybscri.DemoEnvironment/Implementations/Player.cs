namespace Tybscri.DemoEnvironment;

internal class Player : IPlayer
{
    public string Name { get; }
    public double Health { get; private set; }
    public double MaxHealth { get; }
    public bool IsAlive => Health > 0;
    public ILocation CurrentLocation { get; private set; }

    private readonly List<Action<IDamageEvent>> _damageHandlers = [];

    public Player(string name, ILocation startingLocation, double maxHealth = 100)
    {
        Name = name;
        CurrentLocation = startingLocation;
        MaxHealth = maxHealth;
        Health = maxHealth;
    }

    public void TakeDamage(double amount)
    {
        Health = Math.Max(0, Health - amount);
        var isCritical = Random.Shared.NextDouble() < 0.1;
        var evt = new DamageEvent(amount, isCritical);
        foreach (var handler in _damageHandlers)
        {
            handler(evt);
        }
        if (!IsAlive)
        {
            Console.WriteLine($"[Death] {Name} has died!");
        }
    }

    public void Heal(double amount)
    {
        Health = Math.Min(MaxHealth, Health + amount);
        Console.WriteLine($"[Heal] {Name} healed for {amount}. Health: {Health}/{MaxHealth}");
    }

    public void Damage(IEnemy target, double amount)
    {
        target.TakeDamage(amount);
        Console.WriteLine($"[Combat] {Name} deals {amount} damage!");
    }

    public void MoveTo(ILocation location)
    {
        if (CurrentLocation.ConnectedLocations.Contains(location))
        {
            CurrentLocation = location;
            Console.WriteLine($"[Move] {Name} moved to {location.Name}");
        }
    }

    public void OnDamaged(Action<IDamageEvent> handler) => _damageHandlers.Add(handler);

    public void OnInterval(double seconds, Action handler)
    {
        Console.WriteLine($"[Timer] Registered interval handler for {seconds} seconds");
    }
}
