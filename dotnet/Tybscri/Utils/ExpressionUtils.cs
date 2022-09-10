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
}