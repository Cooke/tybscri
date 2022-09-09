using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class MissingStatementNode : Node
{
    public override void SetupScopes(ScopeContext scopeContext)
    {
        Scope = scopeContext.Scope;
    }
    
    public override void ResolveTypes(AnalyzeContext context)
    {
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        throw new TybscriException("Missing statement");
    }
}