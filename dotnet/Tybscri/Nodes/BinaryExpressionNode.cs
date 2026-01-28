using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Interpreter;

namespace Tybscri.Nodes;

public class BinaryExpressionNode : IExpressionNode, IAsyncEvaluatable
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

    public TybscriType ValueType { get; private set; } = StandardTypes.Unknown;

    public void SetupScopes(Scope scope)
    {
        _left.SetupScopes(scope);
        _right.SetupScopes(_left.Scope);
        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
        _left.Resolve(context);
        _right.Resolve(context with { ExpectedType = _left.ValueType });

        ValueType = _comparisonToken.Text switch
        {
            "<" => StandardTypes.Boolean,
            ">" => StandardTypes.Boolean,
            ">=" => StandardTypes.Boolean,
            "<=" => StandardTypes.Boolean,
            "==" => StandardTypes.Boolean,
            "!=" => StandardTypes.Boolean,
            _ => UnionType.Create(_left.ValueType, _right.ValueType)
        };
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext) =>
        Expression.MakeBinary(_comparisonToken.Text switch
        {
            "<" => ExpressionType.LessThan, ">" => ExpressionType.GreaterThan,
            ">=" => ExpressionType.GreaterThanOrEqual, "<=" => ExpressionType.LessThanOrEqual,
            "-" => ExpressionType.Subtract, "+" => ExpressionType.Add,
            "*" => ExpressionType.Multiply, "/" => ExpressionType.Divide,
            "%" => ExpressionType.Modulo, "&&" => ExpressionType.AndAlso,
            "||" => ExpressionType.OrElse,
            _ => throw new TybscriException("Unknown binary operator")
        }, _left.GenerateLinqExpression(generateContext), _right.GenerateLinqExpression(generateContext));

    public async ValueTask<object?> EvaluateAsync(EvalContext context)
    {
        // Short-circuit evaluation for && and ||
        if (_comparisonToken.Text == "&&") {
            var leftVal = await ((IAsyncEvaluatable)_left).EvaluateAsync(context);
            if (!(bool)leftVal!) return false;
            return await ((IAsyncEvaluatable)_right).EvaluateAsync(context);
        }

        if (_comparisonToken.Text == "||") {
            var leftVal = await ((IAsyncEvaluatable)_left).EvaluateAsync(context);
            if ((bool)leftVal!) return true;
            return await ((IAsyncEvaluatable)_right).EvaluateAsync(context);
        }

        var left = await ((IAsyncEvaluatable)_left).EvaluateAsync(context);
        var right = await ((IAsyncEvaluatable)_right).EvaluateAsync(context);

        return _comparisonToken.Text switch
        {
            "<" => Compare(left, right) < 0,
            ">" => Compare(left, right) > 0,
            ">=" => Compare(left, right) >= 0,
            "<=" => Compare(left, right) <= 0,
            "==" => Equals(left, right),
            "!=" => !Equals(left, right),
            "-" => ToDouble(left) - ToDouble(right),
            "+" => ToDouble(left) + ToDouble(right),
            "*" => ToDouble(left) * ToDouble(right),
            "/" => ToDouble(left) / ToDouble(right),
            "%" => ToDouble(left) % ToDouble(right),
            _ => throw new TybscriException("Unknown binary operator")
        };
    }

    private static double ToDouble(object? value) => Convert.ToDouble(value);

    private static int Compare(object? left, object? right)
    {
        if (left is IComparable comparable) {
            return comparable.CompareTo(right);
        }
        throw new TybscriException("Cannot compare values");
    }
}