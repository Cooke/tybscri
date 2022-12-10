using System.Linq.Expressions;
using DotNext.Linq.Expressions;
using DotNext.Metaprogramming;

namespace Tybscri.Nodes;

internal static class ExpressionUtils
{
    public static ConstantExpression NullOf<T>() => Expression.Constant(null, typeof(T));
    
    public static Expression EnsureType(Expression exp, Type type)
    {
        if (exp.Type == type) {
            return exp;
        }

        // if (exp.Type.IsAssignableTo(type) && !exp.Type.IsValueType) {
        //     return exp;
        // }

        if (exp.Type == typeof(void) && !type.IsValueType) {
            return Expression.Block(exp, Expression.Constant(null, type));
        }
        
        return Expression.Convert(exp, type);
    }

    public static Expression WrapVoid(Expression exp, Type type)
    {
        if (exp.Type == typeof(void)) {
            return Expression.Block(exp, Expression.Default(type));
        }

        return exp;
    }

    public static Expression CreateAsyncResult(Expression? x)
    {
        return x == null ? new AsyncResultExpression(false) : new AsyncResultExpression(x, false);
    }

    public static LambdaExpression CreateLambda(FuncType funcType, BlockExpression body, IEnumerable<ParameterExpression>? parameters)
    {
        if (!funcType.Async) {
            return Expression.Lambda(body, parameters);
        }

        var innerLambda = CodeGenerator.AsyncLambda(Type.EmptyTypes, funcType.ReturnType.ClrType,
            AsyncLambdaFlags.None, _ => CodeGenerator.Statement(body));
        return Expression.Lambda(Expression.Invoke(innerLambda), parameters);
    }
}