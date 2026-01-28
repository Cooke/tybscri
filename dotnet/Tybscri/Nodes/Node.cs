using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Interpreter;

namespace Tybscri.Nodes;

public interface INode
{
    Scope Scope { get; }
    
    IReadOnlyCollection<INode> Children { get; }

    public void SetupScopes(Scope scope);

    public void Resolve(ResolveContext context);
}

public interface IExpressionNode : INode, IStatementNode
{
    TybscriType ValueType { get; }
}

public interface IStatementNode : INode
{
    Expression GenerateLinqExpression(GenerateContext context);
}

/// <summary>
/// Interface for nodes that can be evaluated asynchronously by the tree-walking interpreter.
/// </summary>
public interface IAsyncEvaluatable
{
    /// <summary>
    /// Evaluates this node asynchronously, returning its value.
    /// </summary>
    /// <param name="context">The evaluation context containing locals and globals.</param>
    /// <returns>The result of evaluating this node.</returns>
    ValueTask<object?> EvaluateAsync(EvalContext context);
}