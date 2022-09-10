using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class LambdaParameterNode : INode, ISymbolDefinition
{
    private ParameterExpression? _parameter;

    public LambdaParameterNode(string name)
    {
        SymbolName = name;
    }

    public string SymbolName { get; }

    public TybscriType SymbolType { get; private set; } = UnknownType.Instance;
    
    public IReadOnlyCollection<INode> Children => ArraySegment<INode>.Empty;

    public Scope Scope { get; private set; } = Scope.Empty;

    public ParameterExpression ClrExpression => _parameter ?? throw new TybscriException("Missing parameter");


    public void SetupScopes(Scope scope)
    {
        Scope = scope;
    }

    public void ResolveSymbol()
    {
    }

    public void Resolve(ResolveContext context)
    {
        SymbolType = context.ExpectedType ??
                     throw new TybscriException("Identifier definition nodes needs an expected value");
        _parameter = Expression.Parameter(SymbolType.ClrType, SymbolName);
    }

    public ParameterExpression ToClrExpression(GenerateContext generateContext)
    {
        return _parameter ?? throw new TybscriException("Parameter not defined");
    }
}