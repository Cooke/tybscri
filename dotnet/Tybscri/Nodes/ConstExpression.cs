using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class ConstExpression : ExpressionNode
{
    public object? Value { get; }

    public ConstExpression(object? value)
    {
        Value = value;
    }

    public override void Analyze(AnalyzeContext context)
    {
    }

    public override Expression ToClrExpression()
    {
        // TODO type
        return Expression.Constant(Value, Value.GetType());
    }
}