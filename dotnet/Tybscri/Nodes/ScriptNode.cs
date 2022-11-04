using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Symbols;

namespace Tybscri.Nodes;

public class ScriptNode : IExpressionNode
{
    public ScriptNode(IStatementNode[] statements)
    {
        Statements = statements;
    }

    public IStatementNode[] Statements { get; }

    public TybscriType ValueType { get; private set; } = StandardTypes.Unknown;

    public Scope Scope { get; private set; } = Scope.Empty;

    public IReadOnlyCollection<INode> Children => Statements;

    public void SetupScopes(Scope scope)
    {
        Scope = scope;

        BodyUtils.SetupScopes(Statements, scope);
    }

    public void Resolve(ResolveContext context)
    {
        foreach (var child in Statements) {
            child.Resolve(context);
        }
        
        ValueType = BodyUtils.CalculateReturnType(Statements);
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        return BodyUtils.GenerateLinqExpression(Statements, ValueType.ClrType, generateContext.Async);
    }
}