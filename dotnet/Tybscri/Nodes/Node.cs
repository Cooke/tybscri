using System.Linq.Expressions;

namespace Tybscri.Nodes;

public abstract class Node
{
    public Node[] Children { get; }

    public Scope Scope { get; protected set; } = Scope.Empty;

    public TybscriType ValueType { get; protected set; } = StandardTypes.Unknown;

    protected Node(params Node[] children)
    {
        Children = children;
    }

    public virtual Scope SetupScopes(Scope scope)
    {
        foreach (var child in Children) {
            scope = child.SetupScopes(scope);
        }

        Scope = scope;
        return scope;
    }

    public virtual void ResolveTypes(CompileContext context, AnalyzeContext analyzeContext)
    {
        foreach (var child in Children) {
            child.ResolveTypes(context, analyzeContext);
        }
    }

    public abstract Expression ToClrExpression(GenerateContext generateContext);
}