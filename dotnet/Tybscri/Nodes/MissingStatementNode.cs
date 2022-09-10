using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class MissingStatementNode : IStatementNode
{
    public Scope Scope { get; private set; } = Scope.Empty;
    
    public IReadOnlyCollection<INode> Children => ArraySegment<INode>.Empty;

    public void SetupScopes(Scope scope)
    {
        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
    }

    public Expression ToClrExpression(GenerateContext generateContext)
    {
        throw new TybscriException("Missing statement");
    }
}