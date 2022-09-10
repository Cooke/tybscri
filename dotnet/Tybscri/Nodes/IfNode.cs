using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Utils;

namespace Tybscri.Nodes;

internal class IfNode : IExpressionNode
{
    public IfNode(IExpressionNode exp, IExpressionNode then, IExpressionNode? elseNode)
    {
        Exp = exp;
        Then = then;
        ElseNode = elseNode;

        Children = new[] { Exp, Then, ElseNode }.Where(x => x != null).ToArray()!;
    }

    public IExpressionNode Exp { get; }

    public IExpressionNode Then { get; }

    public IExpressionNode? ElseNode { get; }

    public IReadOnlyCollection<INode> Children { get; }

    public Scope Scope { get; private set; } = Scope.Empty;

    public TybscriType ValueType { get; private set; } = UnknownType.Instance;

    public void SetupScopes(Scope scope)
    {
        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
        Exp.Resolve(context);
        Then.Resolve(context);
        ElseNode?.Resolve(context);
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        var elseExp = ElseNode?.GenerateLinqExpression(generateContext) ?? Expression.Constant(null, typeof(object));
        var thenExp = Then.GenerateLinqExpression(generateContext);
        return Expression.Condition(Exp.GenerateLinqExpression(generateContext), thenExp, elseExp,
            ClrTypeUtils.FindCommonType(thenExp.Type, elseExp.Type));
    }
}