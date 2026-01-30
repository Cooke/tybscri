using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Interpreter;

namespace Tybscri.Nodes;

internal class BreakNode : IExpressionNode, IAsyncEvaluatable
{
    public BreakNode()
    {
        Children = Array.Empty<INode>();
    }

    public IReadOnlyCollection<INode> Children { get; }

    public Scope Scope { get; private set; } = Scope.Empty;

    public TybscriType ValueType => NeverType.Instance;

    public void SetupScopes(Scope scope)
    {
        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        // This would require loop context with break label - throw for now
        throw new NotImplementedException("Break in LINQ expression generation not yet supported");
    }

    public ValueTask<object?> EvaluateAsync(EvalContext context)
    {
        throw new BreakException();
    }
}
