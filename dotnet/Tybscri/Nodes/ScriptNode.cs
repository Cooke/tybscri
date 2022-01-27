using System.Linq.Expressions;
using System.Runtime.InteropServices.ComTypes;

namespace Tybscri.Nodes;

public class ScriptNode : Node
{
    private List<SourceSymbol> _scopeSymbols;

    public ScriptNode(Node[] statements) : base(statements)
    {
    }

    public override Scope SetupScopes(Scope scope)
    {
        _scopeSymbols = new List<SourceSymbol>();
        foreach (var child in Children.OfType<Function>()) {
            _scopeSymbols.Add(new SourceSymbol(child.Name.Text, child));
        }

        var childScope = scope.CreateChildScope(_scopeSymbols);
        Scope = childScope;

        foreach (var child in Children) {
            child.SetupScopes(childScope);
        }

        return scope;
    }

    public override BlockExpression ToClrExpression() =>
        Expression.Block(_scopeSymbols.Select(x => x.ClrExpression).Cast<ParameterExpression>(),
            Children.Select(x => x.ToClrExpression()));
}