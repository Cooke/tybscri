using System.Linq.Expressions;

namespace Tybscri.Nodes;

public interface INode
{
    Scope Scope { get; }
    
    IReadOnlyCollection<INode> Children { get; }

    public void SetupScopes(Scope scope);

    public void Resolve(ResolveContext context);
}

public interface IExpressionNode : INode
{
    TybscriType ExpressionType { get; }
    
    Expression ToClrExpression(GenerateContext context);
}

public interface IStatementNode : INode
{
    Expression ToClrExpression(GenerateContext context);
}