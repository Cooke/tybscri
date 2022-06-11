using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class MissingStatement : Node
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
        throw new CompileException("Missing statement");
    }
}