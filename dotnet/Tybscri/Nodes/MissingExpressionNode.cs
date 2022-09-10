using System.Linq.Expressions;
using Tybscri.Common;

namespace Tybscri.Nodes;

public class MissingExpressionNode : IExpressionNode
{
    public Scope Scope { get; private set; } = Scope.Empty;
    
    public IReadOnlyCollection<INode> Children => ArraySegment<INode>.Empty;

    public TybscriType ValueType => UnknownType.Instance;

    public void SetupScopes(Scope scope)
    {
        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        throw new NotImplementedException();
    }
}