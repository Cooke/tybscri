using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class Block : Node
{
    public Block(Token lcurl, Node[] statements, Token rcurl) : base(statements)
    {
    }

    public override Expression ToClrExpression()
    {
        return Expression.Block(Children.Select(x => x.ToClrExpression()));
    }
}