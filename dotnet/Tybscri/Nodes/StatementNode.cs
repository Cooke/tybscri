using System.Linq.Expressions;

namespace Tybscri.Nodes;

public abstract class StatementNode
{
    public abstract void Analyze(AnalyzeContext context);
    public abstract Expression ToClrExpression();
}