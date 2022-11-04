using System.Linq.Expressions;
using DotNext.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Symbols;

namespace Tybscri.Nodes;

public static class BodyUtils
{
    public static void SetupScopes(IReadOnlyCollection<IStatementNode> statements, Scope scope)
    {
        foreach (var func in statements.OfType<FunctionNode>()) {
            scope = scope.WithSymbol(new SourceSymbol(func.Name.Text, func));
        }

        foreach (var statement in statements) {
            statement.SetupScopes(scope);
            scope = statement.Scope;
        }
    }

    public static TybscriType CalculateReturnType(IReadOnlyCollection<IStatementNode> statements)
    {
        var implicitReturnType = statements.LastOrDefault(x => x is not FunctionNode) switch
        {
            IExpressionNode valueNode => valueNode.ValueType,
            ReturnNode => StandardTypes.Never,
            _ => StandardTypes.Null
        };
        var allReturns = FindReturns(statements).Concat(new[] { implicitReturnType });
        return UnionType.Create(allReturns.ToArray());
    }

    private static IEnumerable<TybscriType> FindReturns(IReadOnlyCollection<INode> nodes)
    {
        foreach (var child in nodes) {
            foreach (var innerReturn in FindReturns(child)) {
                yield return innerReturn;
            }
        }
    }

    private static IEnumerable<TybscriType> FindReturns(INode node)
    {
        if (node is FunctionNode or LambdaLiteralNode) {
            yield break;
        }

        if (node is ReturnNode nodeExpression) {
            yield return nodeExpression.ReturnValue?.ValueType ?? VoidType.Instance;
        }

        foreach (var ret in FindReturns(node.Children)) {
            yield return ret;
        }
    }

    public static BlockExpression GenerateLinqExpression(IReadOnlyCollection<IStatementNode> statements,
        Type clrReturnType,
        bool async)
    {
        var variables = statements.OfType<ISymbolDefinitionNode>().Select(x => x.SymbolLinqExpression);
        var returnLabel = Expression.Label(clrReturnType, "ReturnLabel");
        var innerGenerateContext =
            new GenerateContext(async ? ExpressionUtils.CreateAsyncResult : x => Expression.Return(returnLabel, x),
                async);
        var statementsWithReturnLabel = statements.OrderBy(x => x is FunctionNode ? 0 : 1)
            .Select(x => x.GenerateLinqExpression(innerGenerateContext)).Select((statement, i) =>
                i < statements.Count - 1
                    ? statement
                    : (async
                        ? (statement.Type != typeof(void) ? new AsyncResultExpression(statement, false) : statement)
                        : Expression.Label(returnLabel, ExpressionUtils.WrapVoid(statement, clrReturnType))));
        return Expression.Block(variables, statementsWithReturnLabel);
    }
}