using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class BinaryExpressionNode : Node
{
    private readonly Node _left;
    private readonly Token _comparisonToken;
    private readonly Node _right;

    public BinaryExpressionNode(Node left, Token comparisonToken, Node right)
    {
        _left = left;
        _comparisonToken = comparisonToken;
        _right = right;
    }

    public override void SetupScopes(Scope scope)
    {
        _left.SetupScopes(scope);
        _right.SetupScopes(_left.Scope);
        Scope = scope;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        ValueType = StandardTypes.Boolean;
        _left.ResolveTypes(context);
        _right.ResolveTypes(context with { ExpectedType = _left.ValueType });
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        return Expression.MakeBinary(_comparisonToken.Text switch
        {
            "<" => ExpressionType.LessThan, ">" => ExpressionType.GreaterThan,
            _ => throw new TybscriException("Unknown binary operator")
        }, _left.ToClrExpression(generateContext), _right.ToClrExpression(generateContext));
    }
}