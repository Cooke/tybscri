using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class IdentifierNode : ExpressionNode
{
    public string Name { get; }

    public IdentifierNode(string name)
    {
        Name = name;
    }

    public override void ResolveTypes(CompileContext context, TybscriType? expectedType)
    {
        
    }

    public override Expression ToClrExpression()
    {
        throw new NotImplementedException();
    }
}