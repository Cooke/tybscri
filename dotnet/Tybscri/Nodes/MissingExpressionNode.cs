using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class MissingExpressionNode : Node
{
    public override void SetupScopes(Scope scope)
    {
        Scope = scope;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        throw new NotImplementedException();
    }
}