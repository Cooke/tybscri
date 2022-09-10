using System.Linq.Expressions;
using Tybscri.Common;

namespace Tybscri.Nodes;

public class ExpressionStatementNode : IStatementNode, IExpressionNode
{
    public ExpressionStatementNode(IExpressionNode expression)
    {
        Expression = expression;
        Children = new[] { expression };
    }

    public IExpressionNode Expression { get; }

    public Scope Scope => Expression.Scope;

    public TybscriType ValueType => Expression.ValueType;

    public IReadOnlyCollection<INode> Children { get; }

    public void SetupScopes(Scope scope)
    {
        Expression.SetupScopes(scope);
    }

    public void Resolve(ResolveContext context)
    {
        Expression.Resolve(context);
    }

    public Expression GenerateLinqExpression(GenerateContext context) => Expression.GenerateLinqExpression(context);
}