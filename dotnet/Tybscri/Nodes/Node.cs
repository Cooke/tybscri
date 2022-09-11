using System.Linq.Expressions;
using Tybscri.Common;

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