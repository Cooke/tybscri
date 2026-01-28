using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Interpreter;

namespace Tybscri.Nodes;

public class MissingExpressionNode : IExpressionNode, IAsyncEvaluatable
{
    public Scope Scope { get; private set; } = Scope.Empty;
    
    public IReadOnlyCollection<INode> Children => ArraySegment<INode>.Empty;

    public TybscriType ValueType => UnknownType.Instance;

    public void SetupScopes(Scope scope)
    {
        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        throw new NotImplementedException();
    }

    public ValueTask<object?> EvaluateAsync(EvalContext context)
    {
        throw new TybscriException("Cannot evaluate missing expression");
    }
}