using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class Block
{
    public List<StatementNode> Statements { get; }

    public Block(Token lcurl, List<StatementNode> statements, Token rcurl)
    {
        Statements = statements;
    }

    public Expression ToClrExpression()
    {
        return Expression.Block(Statements.Select(x => x.ToClrExpression()));
    }
}