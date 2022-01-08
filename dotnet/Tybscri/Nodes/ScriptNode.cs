using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class ScriptNode
{
    public List<StatementNode> Statements { get; }

    public ScriptNode(List<StatementNode> statements)
    {
        Statements = statements;
    }

    public void SetupScopes(Scope scope)
    {
        foreach (var x in Statements) {
            scope = x.SetupScopes(scope);
        }
    }

    public void ResolveTypes(CompileContext context, TybscriType? expectedType = null)
    {
        foreach (var statement in Statements) {
            statement.ResolveTypes(context, expectedType);
        }
    }

    public Expression<Func<TResult>> ToClrExpression<TResult>() =>
        Expression.Lambda<Func<TResult>>(Expression.Block(Statements.Select(x => x.ToClrExpression())));
}