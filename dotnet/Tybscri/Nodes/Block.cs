using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class Block : Node
{
    private List<SourceSymbol>? _scopeSymbols;

    public Block(Token lcurl, Node[] statements, Token rcurl) : base(statements)
    {
    }

    public override void SetupScopes(Scope scope)
    {
        Scope = scope;
        
        _scopeSymbols = new List<SourceSymbol>();
        foreach (var child in Children.OfType<Function>()) {
            _scopeSymbols.Add(new SourceSymbol(child.Name.Text, child));
        }

        var childScope = scope.CreateChildScope(_scopeSymbols);
        foreach (var child in Children) {
            child.SetupScopes(childScope);
            childScope = child.Scope;
        }
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        foreach (var child in Children) {
            child.ResolveTypes(context);
        }
        
        ValueType = Children.LastOrDefault()?.ValueType ?? UnknownType.Instance;
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        if (_scopeSymbols is null) {
            throw new InvalidOperationException("Scopes have not been setup");
        }

        return Expression.Block(_scopeSymbols.Select(x => x.ClrExpression).Cast<ParameterExpression>(),
            Children.Select(x => x.ToClrExpression(generateContext)));
    }
}