using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class ReturnExpression : Node
{
    public Node? ReturnValue { get; }

    public ReturnExpression(Node? returnValue) : base(returnValue != null ? new[] { returnValue } : Array.Empty<Node>())
    {
        ReturnValue = returnValue;
    }

    public override void ResolveTypes(CompileContext context, AnalyzeContext analyzeContext)
    {
        base.ResolveTypes(context, analyzeContext);
        ValueType = NeverType.Instance;
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        return Expression.Return(generateContext.ReturnLabel, ReturnValue?.ToClrExpression(generateContext));
    }
}