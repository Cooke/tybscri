using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal abstract class ExpressionNode
{
    public abstract void Analyze(AnalyzeContext context);

    public abstract Expression ToClrExpression();
}