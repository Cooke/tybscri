using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class IdentifierDefinitionNode : Node, ISymbolDefinitionNode
{
    private ParameterExpression? _parameter;
    public string Name { get; }

    public IdentifierDefinitionNode(string name) : base()
    {
        Name = name;
    }

    public override void SetupScopes(Scope scope)
    {
        Scope = scope;
    }

    public ParameterExpression LinqExpression => _parameter ?? throw new TybscriException("Missing parameter");

    public override void ResolveTypes(AnalyzeContext context)
    {
    }

    public void SetType(TybscriType? contextExpectedType)
    {
        ValueType = contextExpectedType ??
                    throw new TybscriException("Identifier definition nodes needs an expected value");
        _parameter = Expression.Parameter(ValueType.ClrType, Name);
    }

    public override ParameterExpression ToClrExpression(GenerateContext generateContext)
    {
        return _parameter ?? throw new TybscriException("Parameter not defined");
    }
}