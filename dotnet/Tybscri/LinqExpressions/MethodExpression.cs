using System.Linq.Expressions;

namespace Tybscri.LinqExpressions;

public class MethodExpression : Expression
{
    public Expression Instance { get; }

    public TybscriMember MemberInfo { get; }

    public MethodExpression(Expression instance, TybscriMember memberInfo)
    {
        Instance = instance;
        MemberInfo = memberInfo;
    }

    public override ExpressionType NodeType => ExpressionType.Extension;

    public override Type Type => MemberInfo.Type.ClrType;

    // public override Expression Reduce()
    // {
    //     if (MemberInfo.Type is TybscriFuncType funcType)
    //     {
    //         var paras = funcType.Parameters.Select(p => Parameter(p.Type.ClrType, p.Name)).ToArray();
    //
    //         MemberInfo.
    //         var callMethodExpression = Call(Instance, (MethodInfo)MemberInfo.ClrMember, paras);
    //         return Lambda(
    //             funcType.ReturnType.ClrType == typeof(void)
    //                 ? Block(callMethodExpression, Constant(null, typeof(object)))
    //                 : (Expression) callMethodExpression, paras);
    //     }
    //
    //     return MakeMemberAccess(Instance, MemberInfo.ClrMemberInfo);
    // }
}