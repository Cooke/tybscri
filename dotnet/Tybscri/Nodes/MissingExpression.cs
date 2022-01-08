using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class MissingExpression : ExpressionNode
{
    public override void ResolveTypes(CompileContext context, TybscriType? expectedType)
    {
    }

    public override Expression ToClrExpression()
    {
        throw new NotImplementedException();
    }
}