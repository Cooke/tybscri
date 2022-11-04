using System.Linq.Expressions;
using System.Reflection;
using DotNext.Linq.Expressions;

namespace Tybscri.LinqExpressions;

public class TybscriInvokeExpression : Expression
{
    public Expression Instance { get; }

    public IEnumerable<Expression> Arguments { get; }

    public bool Await { get; }

    private readonly Expression _reduced;

    public TybscriInvokeExpression(Expression instance, IEnumerable<Expression> arguments, bool await)
    {
        Instance = instance;
        Arguments = arguments;
        Await = await;
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
        return Await ? GetInvokeExp().Await() : GetInvokeExp();

        Expression GetInvokeExp()
        {
            if (Instance is TybscriMemberExpression { MemberInfo: MethodInfo methodInfo } memberExpression) {
                return Call(memberExpression.Instance, methodInfo, Arguments);
            }

            return Invoke(Instance, Arguments);
        }
    }


    public override bool CanReduce => true;
}