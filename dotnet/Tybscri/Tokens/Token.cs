namespace Tybscri;

public abstract class Token
{
    public abstract string Text { get; }
    public abstract int Line { get; }
    public abstract int Column { get; }
    public abstract int Index { get; }
}
