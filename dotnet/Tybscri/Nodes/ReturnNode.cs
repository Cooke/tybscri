using System.Linq.Expressions;

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

    public Expression ToClrExpression(GenerateContext generateContext)
    {
        return Expression.Return(generateContext.ReturnLabel, ReturnValue?.ToClrExpression(generateContext));
    }
}