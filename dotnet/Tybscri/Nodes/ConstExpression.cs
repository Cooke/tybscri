using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class ConstExpression : Node
{
    public object? Value { get; }
    
    public ConstExpression(object? value, TybscriType type)
    {
        Value = value;
        ValueType = type;
    }

    public override void SetupScopes(Scope scope)
    {
        Scope = scope;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        return Expression.Constant(Value, ValueType.ClrType);
    }
}