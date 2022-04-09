using System.Linq.Expressions;
using System.Runtime.InteropServices.ComTypes;

namespace Tybscri.Nodes;

public class ScriptNode : Node
{
    private List<SourceSymbol>? _scopeSymbols;

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

    public override void ResolveTypes(CompileContext context, AnalyzeContext analyzeContext)
    {
        base.ResolveTypes(context, analyzeContext);
        ValueType = Children.Last().ValueType;
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        if (_scopeSymbols == null) {
            throw new InvalidOperationException("Scopes have not been setup");
        }

        var scriptExitLabel = Expression.Label(ValueType.ClrType, "LastScriptStatement");
        var innerGenerateContext = generateContext with { ReturnLabel = scriptExitLabel };

        return Expression.Block(_scopeSymbols.Select(x => x.ClrExpression).Cast<ParameterExpression>(),
            Children.Select(x => x.ToClrExpression(innerGenerateContext)).Select((exp, index) =>
                index < Children.Length - 1 ? exp : Expression.Label(scriptExitLabel, exp)));
    }
}