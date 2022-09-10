using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class ConstExpressionNode : IExpressionNode
{
    public ConstExpressionNode(object? value, TybscriType type)
    {
        Value = value;
        ExpressionType = type;
    }

    public object? Value { get; }

    public Scope Scope { get; private set; } = Scope.Empty;

    public TybscriType ExpressionType { get; }

    public IReadOnlyCollection<INode> Children => Array.Empty<INode>();

    public void SetupScopes(Scope scope)
    {
        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
    }

    public Expression ToClrExpression(GenerateContext generateContext)
    {
        return Expression.Constant(Value, ExpressionType.ClrType);
    }
}