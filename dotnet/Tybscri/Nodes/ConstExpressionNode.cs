using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class ConstExpressionNode : Node
{
    public object? Value { get; }
    
    public ConstExpressionNode(object? value, TybscriType type)
    {
        Value = value;
        ValueType = type;
    }

    public override void SetupScopes(ScopeContext scopeContext)
    {
        Scope = scopeContext.Scope;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        return Expression.Constant(Value, ValueType.ClrType);
    }
}