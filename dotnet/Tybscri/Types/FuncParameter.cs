namespace Tybscri;

public class FuncParameter
{
    public string Name { get; }
    public TybscriType Type { get; }

    public FuncParameter(string name, TybscriType type)
    {
        Name = name;
        Type = type;
    }
}