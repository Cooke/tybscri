using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class MissingStatement : Node
{
    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        throw new CompileException("Missing statement");
    }
}