using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class MissingStatement : Node
{
    public override Expression ToClrExpression()
    {
        throw new NotImplementedException();
    }
}