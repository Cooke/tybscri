using System.Linq.Expressions;

namespace Tybscri;

public abstract class Symbol
{
    public abstract void ResolveTypes(AnalyzeContext context);

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

    public override void ResolveTypes(AnalyzeContext context)
    {
    }

    public override TybscriType ValueType => _valueType;

    public override string Name => _name;

    public override Expression ClrExpression => _getExpression;
}

public class SourceSymbol : Symbol
{
    private readonly Func<ISymbolDefinitionNode> _laterSymbol;

    public SourceSymbol(string name, ISymbolDefinitionNode node) : this(name, () => node)
    {
    }

    public SourceSymbol(string name, Func<ISymbolDefinitionNode> laterSymbol)
    {
        Name = name;
        _laterSymbol = laterSymbol;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        Node.ResolveTypes(context);
    }

    public override TybscriType ValueType => Node.ValueType;

    public override string Name { get; }

    public ISymbolDefinitionNode Node => _laterSymbol();

    public override Expression ClrExpression => Node.LinqExpression;
}