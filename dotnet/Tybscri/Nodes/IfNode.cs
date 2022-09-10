using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Utils;

namespace Tybscri.Nodes;

internal class IfNode : IExpressionNode
{
    public IfNode(IExpressionNode condition, IExpressionNode then, IExpressionNode? @else)
    {
        Condition = condition;
        Then = then;
        Else = @else;

        Children = new[] { Condition, Then, Else }.Where(x => x != null).ToArray()!;
    }

    public IExpressionNode Condition { get; }

    public IExpressionNode Then { get; }

    public IExpressionNode? Else { get; }

    public IReadOnlyCollection<INode> Children { get; }

    public Scope Scope { get; private set; } = Scope.Empty;

    public TybscriType ValueType { get; private set; } = UnknownType.Instance;

    public void SetupScopes(Scope scope)
    {
        Condition.SetupScopes(scope);
        Then.SetupScopes(scope);
        Else?.SetupScopes(scope);
        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
        Condition.Resolve(context);
        Then.Resolve(context);
        Else?.Resolve(context);
        ValueType = UnionType.Create(Then.ValueType, Else?.ValueType ?? StandardTypes.Null);
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        var thenExp = ExpressionUtils.EnsureType(Then.GenerateLinqExpression(generateContext), ValueType.ClrType);
        var elseExp = ExpressionUtils.EnsureType(Else?.GenerateLinqExpression(generateContext) ?? Expression.Constant(null, typeof(object)), ValueType.ClrType);
        return Expression.Condition(Condition.GenerateLinqExpression(generateContext), thenExp, elseExp,
            ValueType.ClrType);
    }
}