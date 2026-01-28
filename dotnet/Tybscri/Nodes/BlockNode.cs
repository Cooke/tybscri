using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Interpreter;
using Tybscri.Symbols;

namespace Tybscri.Nodes;

public class BlockNode : IExpressionNode, IAsyncEvaluatable
{
    public BlockNode(IStatementNode[] statements)
    {
        Statements = statements;
    }

    public IStatementNode[] Statements { get; }

    public IReadOnlyCollection<INode> Children => Statements;

    public Scope Scope { get; private set; } = Scope.Empty;

    public TybscriType ValueType { get; private set; } = StandardTypes.Unknown;

    public void SetupScopes(Scope scope)
    {
        Scope = scope;

        var scopeSymbols = new List<SourceSymbol>();
        foreach (var func in Statements.OfType<FunctionNode>()) {
            scopeSymbols.Add(new SourceSymbol(func.Name.Text, func));
        }

        var childScope = scope.CreateChildScope(scopeSymbols);
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

        ValueType = Statements.LastOrDefault(x => x is not FunctionNode) switch
        {
            IExpressionNode valueNode => valueNode.ValueType,
            ReturnNode => StandardTypes.Never,
            _ => StandardTypes.Null
        };
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        var variables = Statements.OfType<ISymbolDefinitionNode>().Select(x => x.SymbolLinqExpression);
        var statements = Statements.OrderBy(x => x is FunctionNode ? 0 : 1).Select(x => x.GenerateLinqExpression(generateContext));
        return Expression.Block(variables, statements);
    }

    public async ValueTask<object?> EvaluateAsync(EvalContext context)
    {
        // Create a child scope for block-local variables
        var blockContext = context.CreateChildScopeWithLocals();

        object? result = null;

        // Evaluate functions first (hoisting), then other statements
        var orderedStatements = Statements.OrderBy(x => x is FunctionNode ? 0 : 1);

        foreach (var statement in orderedStatements) {
            result = await ((IAsyncEvaluatable)statement).EvaluateAsync(blockContext);
        }

        return result;
    }
}