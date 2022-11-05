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

    public static bool IsAsync(IEnumerable<INode> statements)
    {
        return statements.Any(IsAsync);
    }

    private static bool IsAsync(INode node)
    {
        return node switch
        {
            FunctionNode => false,
            LambdaLiteralNode => false,
            InvocationNode { Target.ValueType: FuncType { Async: true } } => true,
            MemberInvocationNode { MemberType: FuncType { Async: true } } => true,
            _ => IsAsync(node.Children)
        };
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
        var orderedStatements = statements.OrderBy(x => x is FunctionNode ? 0 : 1).ToArray();

        var blockStatements = orderedStatements.Select((statement, i) =>
            i < statements.Count - 1
                ? statement.GenerateLinqExpression(innerGenerateContext)
                : CreateImplicitReturn(statement));
        return Expression.Block(variables, blockStatements);

        Expression CreateImplicitReturn(IStatementNode statement)
        {
            var statementExp = statement.GenerateLinqExpression(innerGenerateContext);
            if (!async) {
                return Expression.Label(returnLabel, ExpressionUtils.WrapVoid(statementExp, clrReturnType));
            }

            var implicitReturn = statement is IExpressionNode exp && !exp.ValueType.Equals(NeverType.Instance) &&
                                 !exp.ValueType.Equals(VoidType.Instance);
            if (implicitReturn) {
                return new AsyncResultExpression(statementExp, false);
            }

            return statementExp;
        }
    }
}