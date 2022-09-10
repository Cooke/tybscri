using System.Linq.Expressions;
using Tybscri.Common;

namespace Tybscri.Nodes;

public class ConstExpressionNode : IExpressionNode
{
    public ConstExpressionNode(object? value, TybscriType type)
    {
        Value = value;
        ValueType = type;
    }

    public object? Value { get; }

    public Scope Scope { get; private set; } = Scope.Empty;

    public TybscriType ValueType { get; }

    public IReadOnlyCollection<INode> Children => Array.Empty<INode>();

    public void SetupScopes(Scope scope)
    {
        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        return Expression.Constant(Value, ValueType.ClrType);
    }
}