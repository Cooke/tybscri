using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class ExpressionStatement : StatementNode
{
    public ExpressionNode Exp { get; }

    public ExpressionStatement(ExpressionNode exp)
    {
        Exp = exp;
    }

    public override void Analyze(AnalyzeContext context)
    {
        Exp.Analyze(context);
    }

    public override Expression ToClrExpression()
    {
        return Exp.ToClrExpression();
    }
}