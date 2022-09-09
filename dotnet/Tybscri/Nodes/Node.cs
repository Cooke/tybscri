using System.Linq.Expressions;

namespace Tybscri.Nodes;

public record ScopeContext(Scope Scope);

public abstract class Node
{
    public IReadOnlyCollection<Node> Children { get; }

    public Scope Scope { get; protected set; } = Scope.Empty;

    public virtual TybscriType ValueType { get; protected set; } = StandardTypes.Unknown;

    protected Node(IReadOnlyCollection<Node> children)
    {
        Children = children;
    }

    protected Node(params Node[] children)
    {
        Children = children;
    }

    public abstract void SetupScopes(ScopeContext scopeContext);

    public abstract void ResolveTypes(AnalyzeContext context);

    public abstract Expression ToClrExpression(GenerateContext generateContext);

    public virtual void Resolve(CompileContext context)
    {
    }
}