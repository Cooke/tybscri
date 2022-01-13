using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class MissingExpression : Node
{
    public override Expression ToClrExpression()
    {
        throw new NotImplementedException();
    }
}