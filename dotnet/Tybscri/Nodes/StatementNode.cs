using System.Linq.Expressions;

namespace Tybscri.Nodes;

public abstract class StatementNode
{
    public abstract Scope SetupScopes(Scope scope);
    
    public abstract void ResolveTypes(CompileContext context, TybscriType? expectedType);
    
    public abstract Expression ToClrExpression();
}