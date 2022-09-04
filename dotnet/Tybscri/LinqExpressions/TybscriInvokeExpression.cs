using System.Linq.Expressions;
using System.Reflection;

namespace Tybscri.LinqExpressions;

public class TybscriInvokeExpression : Expression
{
    public Expression Instance { get; }
    
    public IEnumerable<Expression> Arguments { get; }
    
    private readonly Expression _reduced;

    public TybscriInvokeExpression(Expression instance, IEnumerable<Expression> arguments)
    {
        Instance = instance;
        Arguments = arguments;
        _reduced = CreateReduced();
    }

    public override ExpressionType NodeType => ExpressionType.Extension;

    public override Type Type => _reduced.Type;

    public override Expression Reduce()
    {
        return CreateReduced();
    }

    private Expression CreateReduced()
    {
        if (Instance is TybscriMemberExpression { MemberInfo: MethodInfo methodInfo } memberExpression)
        {
            return EnsureValue(Call(memberExpression.Instance, methodInfo, Arguments));
        }

        return EnsureValue(Invoke(Instance, Arguments));
    }

    private Expression EnsureValue(Expression exp)
    {
        if (exp.Type == typeof(void)) {
            return Block(new[] { exp, Constant(null, typeof(object)) });
        }

        return exp;
    }

    public override bool CanReduce => true;
}