using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class MissingStatement : StatementNode
{
    public override void Analyze(AnalyzeContext context)
    {
    }

    public override Expression ToClrExpression()
    {
        throw new NotImplementedException();
    }
}