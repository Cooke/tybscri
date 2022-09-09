using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class IdentifierNode : Node
{
    private Symbol? _symbol;
    public string Name { get; }

    public IdentifierNode(String name)
    {
        Name = name;
    }
    
    public IdentifierNode(Token token)
    {
        Name = token.Text;
    }
    
    public override void SetupScopes(ScopeContext scopeContext)
    {
        Scope = scopeContext.Scope;
        _symbol = Scope.ResolveLast(Name);
        if (_symbol == null) {
            throw new TybscriException($"Unknown symbol {Name}");
        }
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        _symbol?.ResolveTypes(context);
        ValueType = _symbol?.ValueType ?? StandardTypes.Unknown;
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        if (_symbol == null) {
            throw new TybscriException($"Unknown identifier: {Name}");
        }

        return _symbol.ClrExpression;
    }
}