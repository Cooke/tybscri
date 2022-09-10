using System.Linq.Expressions;

namespace Tybscri;

public abstract class Symbol
{
    public abstract void ResolveTypes(ResolveContext context);

    public abstract TybscriType ValueType { get; }

    public abstract string Name { get; }

    public abstract Expression ClrExpression { get; }

    public virtual void Resolve(CompileContext context)
    {
        
    }
}

public class ExternalSymbol : Symbol
{
    private readonly Expression _getExpression;
    private readonly string _name;
    private readonly TybscriType _valueType;

    public ExternalSymbol(Expression getExpression, TybscriType valueType, string name)
    {
        _getExpression = getExpression;
        _valueType = valueType;
        _name = name;
    }

    public override void ResolveTypes(ResolveContext context)
    {
    }

    public override TybscriType ValueType => _valueType;

    public override string Name => _name;

    public override Expression ClrExpression => _getExpression;
}

public class SourceSymbol : Symbol
{
    private readonly ISymbolDefinition _node;

    public SourceSymbol(string name, ISymbolDefinition node)
    {
        Name = name;
        _node = node;
    }

    public override void ResolveTypes(ResolveContext context)
    {
        _node.ResolveSymbol();
    }

    public override TybscriType ValueType => _node.SymbolType;

    public override string Name { get; }

    public override Expression ClrExpression => _node.ClrExpression;
}