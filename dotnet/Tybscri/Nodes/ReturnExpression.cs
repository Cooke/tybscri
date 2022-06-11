using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class ReturnExpression : Node
{
    public Node? ReturnValue { get; }

    public ReturnExpression(Node? returnValue) : base(returnValue != null ? new[] { returnValue } : Array.Empty<Node>())
    {
        ReturnValue = returnValue;
        ValueType = NeverType.Instance;
    }
    
    public override void SetupScopes(Scope scope)
    {
        foreach (var child in Children) {
            child.SetupScopes(scope);
        }

        Scope = scope;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        foreach (var child in Children) {
            child.ResolveTypes(context);
        }
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        return Expression.Return(generateContext.ReturnLabel, ReturnValue?.ToClrExpression(generateContext));
    }
}