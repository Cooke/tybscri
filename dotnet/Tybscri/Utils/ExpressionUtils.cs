using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal static class ExpressionUtils
{
    public static Expression EnsureType(Expression exp, Type type)
    {
        if (exp.Type == type) {
            return exp;
        }

        if (!exp.Type.IsValueType && exp.Type.IsAssignableTo(type)) {
            return exp;
        }

        if (exp.Type == typeof(void) && !type.IsValueType) {
            return Expression.Block(exp, Expression.Constant(null, type));
        }

        return Expression.Convert(exp, type);
    }

    public static Expression WrapVoid(Expression exp, Type type)
    {
        if (exp.Type == typeof(void)) {
            return Expression.Block(exp, Expression.Throw(Expression.New(typeof(InvalidOperationException)), type));
        }

        return exp;
    }

    public static Expression EnsureType(Expression expression, TybscriType from, TybscriType to)
    {
        if (from == to) {
            return expression;
        }
        
        if (to ==)
        
        return expression;
    }
}