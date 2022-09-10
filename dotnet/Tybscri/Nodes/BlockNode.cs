using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class BlockNode : IExpressionNode
{
    private List<SourceSymbol>? _scopeSymbols;

    public BlockNode(IStatementNode[] statements)
    {
        Statements = statements;
    }

    public IStatementNode[] Statements { get; }

    public IReadOnlyCollection<INode> Children => Statements;

    public Scope Scope { get; private set; } = Scope.Empty;

    public TybscriType ExpressionType { get; private set; } = StandardTypes.Unknown;

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

        ExpressionType = Statements.LastOrDefault() switch
        {
            IExpressionNode valueNode => valueNode.ExpressionType,
            ReturnNode => StandardTypes.Never,
            _ => StandardTypes.Null
        };
    }

    public Expression ToClrExpression(GenerateContext generateContext)
    {
        if (_scopeSymbols is null) {
            throw new InvalidOperationException("Scopes have not been setup");
        }

        return Expression.Block(_scopeSymbols.Select(x => x.ClrExpression).Cast<ParameterExpression>(),
            Statements.Select(x => x.ToClrExpression(generateContext)));
    }
}