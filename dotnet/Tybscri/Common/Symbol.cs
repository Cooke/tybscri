using System.Linq.Expressions;

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
    private readonly Func<Expression> _getExpressionResolver;
    private readonly Func<TybscriType> _valueTypeResolver;
    private readonly string _name;
    private Expression? _clrExpression;
    private TybscriType? _valueType;

    public ExternalSymbol(Expression getExpression, TybscriType valueType, string name) : this(() => getExpression,
        () => valueType, name)
    {
    }

    public ExternalSymbol(Func<Expression> getExpressionResolver, Func<TybscriType> valueTypeResolver, string name)
    {
        _getExpressionResolver = getExpressionResolver;
        _valueTypeResolver = valueTypeResolver;
        _name = name;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        _clrExpression = _getExpressionResolver();
        _valueType = _valueTypeResolver();
    }

    public override TybscriType ValueType => _valueType ?? throw new CompileException("Unresolved value type");

    public override string Name => _name;

    public override Expression ClrExpression => _clrExpression ?? throw new CompileException("Unresolved value type");
}

public class SourceSymbol : Symbol
{
    private readonly Func<ISymbolNode> _laterSymbol;

    public SourceSymbol(string name, ISymbolNode node) : this(name, () => node)
    {
    }

    public SourceSymbol(string name, Func<ISymbolNode> laterSymbol)
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

    public ISymbolNode Node => _laterSymbol();

    public override Expression ClrExpression => Node.LinqExpression;
}