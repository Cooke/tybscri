using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class ExpressionStatement : StatementNode
{
    public ExpressionNode Exp { get; }

    public ExpressionStatement(ExpressionNode exp)
    {
        Exp = exp;
    }

    public override Scope SetupScopes(Scope scope)
    {
        return Exp.SetupScopes(scope);
    }

    public override void ResolveTypes(CompileContext context, TybscriType? expectedType)
    {
        Exp.ResolveTypes(context, expectedType);
    }

    public override Expression ToClrExpression()
    {
        return Exp.ToClrExpression();
    }
}