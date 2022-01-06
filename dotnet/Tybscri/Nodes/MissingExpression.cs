using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class MissingExpression : ExpressionNode
{
    public override void Analyze(AnalyzeContext context)
    {
    }

    public override Expression ToClrExpression()
    {
        throw new NotImplementedException();
    }
}