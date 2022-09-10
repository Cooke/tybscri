using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class ScriptNode : IExpressionNode
{
    private List<SourceSymbol>? _scopeSymbols;

    public ScriptNode(IStatementNode[] statements)
    {
        Statements = statements;
    }

    public IStatementNode[] Statements { get; }

    public TybscriType ExpressionType { get; private set; } = StandardTypes.Unknown;

    public Scope Scope { get; private set; } = Scope.Empty;

    public IReadOnlyCollection<INode> Children => Statements;

    public void SetupScopes(Scope scope)
    {
        Scope = scope;

        _scopeSymbols = new List<SourceSymbol>();
        foreach (var func in Statements.OfType<FunctionNode>()) {
            _scopeSymbols.Add(new SourceSymbol(func.Name.Text, func));
        }

        var childScope = scope.CreateChildScope(_scopeSymbols);
        foreach (var statement in Statements) {
            statement.SetupScopes(childScope);
            childScope = statement.Scope;
        }
    }

    public void Resolve(ResolveContext context)
    {
        foreach (var child in Statements) {
            child.Resolve(context);
        }

        ExpressionType = Statements.Last() is IExpressionNode expNode ? expNode.ExpressionType : StandardTypes.Null;
    }


    public Expression ToClrExpression(GenerateContext generateContext)
    {
        if (_scopeSymbols == null) {
            throw new InvalidOperationException("Scopes have not been setup");
        }

        var scriptExitLabel = Expression.Label(ExpressionType.ClrType, "LastScriptStatement");
        var innerGenerateContext = generateContext with { ReturnLabel = scriptExitLabel };

        var body = Statements.Select(x => x.ToClrExpression(innerGenerateContext)).Select((exp, index) =>
            index < Statements.Length - 1 ? exp : Expression.Label(scriptExitLabel, exp));
        return Expression.Block(_scopeSymbols.Select(x => x.ClrExpression).Cast<ParameterExpression>(), body);
    }
}