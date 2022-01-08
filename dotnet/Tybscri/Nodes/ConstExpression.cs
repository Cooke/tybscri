using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class ConstExpression : ExpressionNode
{
    public object? Value { get; }
    
    public TybscriType Type { get; }

    public ConstExpression(object? value, TybscriType type)
    {
        Value = value;
        Type = type;
    }

    public override void ResolveTypes(CompileContext context, TybscriType? expectedType)
    {
    }

    public override Expression ToClrExpression()
    {
        return Expression.Constant(Value, Type.GetClrType());
    }
}