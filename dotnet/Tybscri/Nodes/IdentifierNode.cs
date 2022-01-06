using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class IdentifierNode : ExpressionNode
{
    public string Name { get; }

    public IdentifierNode(string name)
    {
        Name = name;
    }

    public override void Analyze(AnalyzeContext context)
    {
    }

    public override Expression ToClrExpression()
    {
        throw new NotImplementedException();
    }
}