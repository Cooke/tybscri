using Tybscri.Common;

namespace Tybscri.Nodes;

public class LiteralTypeNode : ITypeNode
{
    public LiteralTypeNode(TybscriType type)
    {
        Type = type;
    }

    public Scope Scope { get; private set; } = Scope.Empty;
    
    public IReadOnlyCollection<INode> Children => ArraySegment<INode>.Empty;

    public TybscriType Type { get; }

    public void SetupScopes(Scope scope)
    {
        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
    }
}