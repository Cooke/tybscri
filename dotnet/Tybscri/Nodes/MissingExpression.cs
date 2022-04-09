using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class MissingExpression : Node
{
    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        throw new NotImplementedException();
    }
}