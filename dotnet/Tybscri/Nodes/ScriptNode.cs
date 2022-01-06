using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class ScriptNode
{
    public List<StatementNode> Statements { get; }

    public ScriptNode(List<StatementNode> statements)
    {
        Statements = statements;
    }

    public void Analyze(AnalyzeContext context)
    {
        Statements.ForEach(x => x.Analyze(context));
    }

    public Expression<Func<TContext, TResult>> ToClrExpression<TContext, TResult>() =>
        Expression.Lambda<Func<TContext, TResult>>(Expression.Block(Statements.Select(x => x.ToClrExpression())),
            Expression.Parameter(typeof(TContext)));
}