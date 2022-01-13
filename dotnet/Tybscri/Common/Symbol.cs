using System.Linq.Expressions;

namespace Tybscri;

public abstract class Symbol
{
    public abstract void ResolveTypes(CompileContext context);

    public abstract TybscriType ValueType { get; }
    public abstract string Name { get; }

    public abstract Expression ClrExpression { get; }
}

public class ExternalSymbol : Symbol
{
    private readonly Expression _getExpression;
    private readonly string _name;

    public ExternalSymbol(Expression getExpression, TybscriType valueType, string name)
    {
        _getExpression = getExpression;
        _name = name;
        ValueType = valueType;
    }

    public override void ResolveTypes(CompileContext context)
    {
    }

    public override TybscriType ValueType { get; }

    public override string Name => _name;

    public override Expression ClrExpression => _getExpression;
}