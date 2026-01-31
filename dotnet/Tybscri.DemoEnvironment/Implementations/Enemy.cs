namespace Tybscri.DemoEnvironment;

internal class Enemy : IEnemy
{
    public string Name { get; }
    public double Health { get; private set; }
    public double MaxHealth { get; }
    public bool IsAlive => Health > 0;

    public Enemy(string name, double maxHealth = 50)
    {
        Name = name;
        MaxHealth = maxHealth;
        Health = maxHealth;
    }

    public void TakeDamage(double amount)
    {
        Health = Math.Max(0, Health - amount);
        Console.WriteLine($"[Combat] {Name} takes {amount} damage! Health: {Health}/{MaxHealth}");
        if (!IsAlive)
        {
            Console.WriteLine($"[Death] {Name} has been defeated!");
        }
    }
}
