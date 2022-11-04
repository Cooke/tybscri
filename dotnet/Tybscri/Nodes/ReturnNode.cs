using System.Linq.Expressions;
using Tybscri.Common;

namespace Tybscri.Nodes;

public class ReturnNode : IStatementNode
{
    public ReturnNode(IExpressionNode? returnValue)
    {
        ReturnValue = returnValue;
        Children = returnValue != null ? new[] { returnValue } : Array.Empty<IExpressionNode>();
    }

    public IExpressionNode? ReturnValue { get; }

    public Scope Scope { get; private set; } = Scope.Empty;
    
    public IReadOnlyCollection<INode> Children { get; }

    public void SetupScopes(Scope scope)
    {
        foreach (var child in Children) {
            child.SetupScopes(scope);
        }

        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
        foreach (var child in Children) {
            child.Resolve(context);
        }
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        return generateContext.Return(ReturnValue?.GenerateLinqExpression(generateContext));
    }
}