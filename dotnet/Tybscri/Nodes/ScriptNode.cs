using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Symbols;

namespace Tybscri.Nodes;

public class ScriptNode : IExpressionNode
{
    private List<SourceSymbol>? _scopeSymbols;

    public ScriptNode(IStatementNode[] statements)
    {
        Statements = statements;
    }

    public IStatementNode[] Statements { get; }

    public TybscriType ValueType { get; private set; } = StandardTypes.Unknown;

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

        ValueType = Statements.Last(x => x is not FunctionNode) is IExpressionNode expNode
            ? expNode.ValueType
            : StandardTypes.Null;
    }


    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        if (_scopeSymbols == null) {
            throw new InvalidOperationException("Scopes have not been setup");
        }

        var scriptExitLabel = Expression.Label(ValueType.ClrType, "LastScriptStatement");
        var innerGenerateContext = generateContext with { ReturnLabel = scriptExitLabel };

        var variables = Statements.OfType<ISymbolDefinitionNode>().Select(x => x.SymbolLinqExpression);
        var body = Statements.OrderBy(x => x is FunctionNode ? 0 : 1)
            .Select(x => x.GenerateLinqExpression(innerGenerateContext)).Select((exp, index) =>
                index < Statements.Length - 1 ? exp : Expression.Label(scriptExitLabel, exp));
        return Expression.Block(variables, body);
    }
}