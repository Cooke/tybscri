using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class MissingExpressionNode : IExpressionNode
{
    public Scope Scope { get; private set; } = Scope.Empty;
    
    public IReadOnlyCollection<INode> Children => ArraySegment<INode>.Empty;

    public TybscriType ExpressionType => UnknownType.Instance;

    public void SetupScopes(Scope scope)
    {
        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
    }

    public Expression ToClrExpression(GenerateContext generateContext)
    {
        throw new NotImplementedException();
    }
}