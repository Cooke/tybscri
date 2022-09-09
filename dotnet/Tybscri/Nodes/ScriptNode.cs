using System.Linq.Expressions;
using System.Runtime.InteropServices.ComTypes;

namespace Tybscri.Nodes;

public class ScriptNode : Node
{
    private List<SourceSymbol>? _scopeSymbols;

    public ScriptNode(Node[] statements) : base(statements)
    {
    }

    public override void SetupScopes(Scope scope)
    {
        Scope = scope;

        _scopeSymbols = new List<SourceSymbol>();
        foreach (var child in Children.OfType<FunctionNode>()) {
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

        ValueType = Children.Last().ValueType;
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        if (_scopeSymbols == null) {
            throw new InvalidOperationException("Scopes have not been setup");
        }

        var scriptExitLabel = Expression.Label(ValueType.ClrType, "LastScriptStatement");
        var innerGenerateContext = generateContext with { ReturnLabel = scriptExitLabel };

        var body = Children.Select(x => x.ToClrExpression(innerGenerateContext)).Select((exp, index) =>
            index < Children.Count - 1 ? exp : Expression.Label(scriptExitLabel, exp));
        return Expression.Block(_scopeSymbols.Select(x => x.ClrExpression).Cast<ParameterExpression>(), body);
    }
}