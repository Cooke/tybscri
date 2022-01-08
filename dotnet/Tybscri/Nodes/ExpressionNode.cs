using System.Linq.Expressions;

namespace Tybscri.Nodes;

public abstract class ExpressionNode
{
    public virtual Scope SetupScopes(Scope scope)
    {
        this.Scope = scope;
        return scope;
    }

    public Scope Scope { get; protected set; } = Scope.Empty;

    public abstract void ResolveTypes(CompileContext context, TybscriType? expectedType);

    public abstract Expression ToClrExpression();
}