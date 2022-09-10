using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class BinaryExpressionNode : IExpressionNode
{
    private readonly IExpressionNode _left;
    private readonly Token _comparisonToken;
    private readonly IExpressionNode _right;

    public BinaryExpressionNode(IExpressionNode left, Token comparisonToken, IExpressionNode right)
    {
        _left = left;
        _comparisonToken = comparisonToken;
        _right = right;
        Children = new[] { _left, _right };
    }

    public IReadOnlyCollection<INode> Children { get; }

    public Scope Scope { get; private set; } = Scope.Empty;

    public TybscriType ExpressionType { get; private set; } = StandardTypes.Unknown;

    public void SetupScopes(Scope scope)
    {
        _left.SetupScopes(scope);
        _right.SetupScopes(_left.Scope);
        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
        ExpressionType = StandardTypes.Boolean;
        _left.Resolve(context);
        _right.Resolve(context with { ExpectedType = _left.ExpressionType });
    }

    public Expression ToClrExpression(GenerateContext generateContext) =>
        Expression.MakeBinary(_comparisonToken.Text switch
        {
            "<" => System.Linq.Expressions.ExpressionType.LessThan, ">" => System.Linq.Expressions.ExpressionType.GreaterThan,
            ">=" => System.Linq.Expressions.ExpressionType.GreaterThanOrEqual, "<=" => System.Linq.Expressions.ExpressionType.LessThanOrEqual,
            "-" => System.Linq.Expressions.ExpressionType.Subtract, "+" => System.Linq.Expressions.ExpressionType.Add,
            "*" => System.Linq.Expressions.ExpressionType.Multiply, "/" => System.Linq.Expressions.ExpressionType.Divide,
            "%" => System.Linq.Expressions.ExpressionType.Modulo, "&&" => System.Linq.Expressions.ExpressionType.AndAlso,
            "||" => System.Linq.Expressions.ExpressionType.OrElse,
            _ => throw new TybscriException("Unknown binary operator")
        }, _left.ToClrExpression(generateContext), _right.ToClrExpression(generateContext));
}