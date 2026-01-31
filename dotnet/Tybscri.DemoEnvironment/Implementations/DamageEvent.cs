namespace Tybscri.DemoEnvironment;

internal class DamageEvent : IDamageEvent
{
    public double Amount { get; }
    public bool IsCritical { get; }

    public DamageEvent(double amount, bool isCritical)
    {
        Amount = amount;
        IsCritical = isCritical;
    }
}
