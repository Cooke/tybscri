using System.Linq.Expressions;
using Tybscri.Common;

namespace Tybscri.Nodes;

public interface ITypeNode : INode
{
    public TybscriType Type { get; }
}

public class UnionTypeNode : ITypeNode
{
    public UnionTypeNode(List<ITypeNode> typeNodes)
    {
        TypeNodes = typeNodes;
    }

    public IReadOnlyCollection<ITypeNode> TypeNodes { get; set; }

    public Scope Scope { get; private set; } = Scope.Empty;

    public IReadOnlyCollection<INode> Children => TypeNodes;

    public TybscriType Type { get; private set; } = UnknownType.Instance;

    public void SetupScopes(Scope scope)
    {
        Scope = scope;
        foreach (var child in Children) {
            child.SetupScopes(scope);
        }
    }

    public void Resolve(ResolveContext context)
    {
        foreach (var child in Children) {
            child.Resolve(context);
        }
        
        Type = UnionType.Create(TypeNodes.Select(x => x.Type).ToArray());
    }
}