using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class IfNode : ExpressionNode
{
    public ExpressionNode Exp { get; }
    public Block ThenBlock { get; }

    public IfNode(Token ifToken, Token lparen, ExpressionNode exp, Token rparen, Block thenBlock)
    {
        Exp = exp;
        ThenBlock = thenBlock;
    }

    public override void Analyze(AnalyzeContext context)
    {
    }

    public override Expression ToClrExpression()
    {
        return Expression.IfThen(Exp.ToClrExpression(), ThenBlock.ToClrExpression());
    }
}