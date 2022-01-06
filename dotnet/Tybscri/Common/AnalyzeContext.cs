namespace Tybscri;

public class AnalyzeContext
{
    public Scope Scope { get; }

    public Type? ExpectedType { get; }

    public AnalyzeContext(Scope scope, Type? expectedType)
    {
        Scope = scope;
        ExpectedType = expectedType;
    }
}