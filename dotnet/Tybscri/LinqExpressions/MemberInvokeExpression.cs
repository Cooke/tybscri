using System.Linq.Expressions;
using System.Reflection;

namespace Tybscri.LinqExpressions;

public class MemberInvokeExpression : Expression
{
    public Expression Instace { get; }
    
    public IEnumerable<Expression> Arguments { get; }
    
    private readonly Expression _reduced;

    public MemberInvokeExpression(Expression instace, IEnumerable<Expression> arguments)
    {
        Instace = instace;
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
        if (Instace is MethodExpression methodTarget && methodTarget.MemberInfo.MemberInfo is MethodInfo methodInfo)
        {
            return Call(methodTarget.Instance, methodInfo, Arguments);
        }

        return Invoke(Instace, Arguments);
    }

    public override bool CanReduce => true;
}