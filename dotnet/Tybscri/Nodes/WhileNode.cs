using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Interpreter;

namespace Tybscri.Nodes;

internal class WhileNode : IExpressionNode, IAsyncEvaluatable
{
    public WhileNode(IExpressionNode condition, IExpressionNode body)
    {
        Condition = condition;
        Body = body;
        Children = new INode[] { Condition, Body };
    }

    public IExpressionNode Condition { get; }

    public IExpressionNode Body { get; }

    public IReadOnlyCollection<INode> Children { get; }

    public Scope Scope { get; private set; } = Scope.Empty;

    public TybscriType ValueType => VoidType.Instance;

    public void SetupScopes(Scope scope)
    {
        Condition.SetupScopes(scope);
        Body.SetupScopes(scope);
        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
        Condition.Resolve(context);
        Body.Resolve(context);
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        // Create break and continue labels
        var breakLabel = Expression.Label("break");
        var continueLabel = Expression.Label("continue");

        // Create the loop body with condition check
        var loopBody = Expression.Block(
            Expression.IfThen(
                Expression.Not(Condition.GenerateLinqExpression(generateContext)),
                Expression.Break(breakLabel)
            ),
            Body.GenerateLinqExpression(generateContext),
            Expression.Label(continueLabel)
        );

        // Create the loop
        var loop = Expression.Loop(loopBody, breakLabel);

        // Return a block that evaluates to null (void)
        return Expression.Block(loop, Expression.Constant(null, typeof(object)));
    }

    public async ValueTask<object?> EvaluateAsync(EvalContext context)
    {
        while (true)
        {
            var conditionResult = await ((IAsyncEvaluatable)Condition).EvaluateAsync(context);
            if (!(bool)conditionResult!)
            {
                break;
            }

            try
            {
                await ((IAsyncEvaluatable)Body).EvaluateAsync(context);
            }
            catch (BreakException)
            {
                break;
            }
            catch (ContinueException)
            {
                continue;
            }
        }

        return null;
    }
}
