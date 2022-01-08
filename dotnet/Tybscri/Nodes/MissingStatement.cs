using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class MissingStatement : StatementNode
{
    public override Scope SetupScopes(Scope scope)
    {
        return scope;
    }

    public override void ResolveTypes(CompileContext context, TybscriType? expectedType)
    {
    }

    public override Expression ToClrExpression()
    {
        throw new NotImplementedException();
    }
}