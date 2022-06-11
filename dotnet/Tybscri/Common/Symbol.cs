using System.Linq.Expressions;
using Tybscri.Nodes;

namespace Tybscri;

public abstract class Symbol
{
    public abstract void ResolveTypes(AnalyzeContext context);

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

    public override void ResolveTypes(AnalyzeContext context)
    {
    }

    public override TybscriType ValueType { get; }

    public override string Name => _name;

    public override Expression ClrExpression => _getExpression;
}

public class SourceSymbol : Symbol
{
    private readonly Func<ISymbolNode> _laterSymbol;

    public SourceSymbol(string name, ISymbolNode node)
    {
        Name = name;
        Node = node;
    }

    public SourceSymbol(string name, Func<ISymbolNode> laterSymbol)
    {
        _laterSymbol = laterSymbol;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        Node.ResolveTypes(context);
    }

    public override TybscriType ValueType => Node.ValueType;
    
    public override string Name { get; }

    public ISymbolNode Node => _laterSymbol();

    public override Expression ClrExpression => Node.LinqExpression;
}