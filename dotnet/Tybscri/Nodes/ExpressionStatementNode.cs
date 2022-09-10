using System.Linq.Expressions;

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

    public TybscriType ExpressionType => Expression.ExpressionType;

    public IReadOnlyCollection<INode> Children { get; }

    public void SetupScopes(Scope scope)
    {
        Expression.SetupScopes(scope);
    }

    public void Resolve(ResolveContext context)
    {
        Expression.Resolve(context);
    }

    public Expression ToClrExpression(GenerateContext context) => Expression.ToClrExpression(context);
}