﻿using System.Linq.Expressions;
using System.Reflection;
using System.Reflection.Emit;
using Tybscri.Utils;

namespace Tybscri.LinqExpressions;

public class TybscriMemberExpression : Expression
{
    private readonly Lazy<Expression> _reduced;

    public Expression Instance { get; }

    public MemberInfo MemberInfo { get; }

    public TybscriMemberExpression(Expression instance, MemberInfo memberInfo)
    {
        Instance = instance;
        MemberInfo = memberInfo;
        _reduced = new Lazy<Expression>(CreateReduced);
    }

    public override ExpressionType NodeType => ExpressionType.Extension;

    public override Type Type =>
        MemberInfo switch
        {
            MethodInfo methodInfo => ClrTypeUtils.GetDelegateType(methodInfo),
            PropertyInfo propertyInfo => propertyInfo.PropertyType,
            FieldInfo fieldInfo => fieldInfo.FieldType,
            _ => throw new NotSupportedException()
        };

    public override Expression Reduce()
    {
        return _reduced.Value;
    }

    public override bool CanReduce => true;

    private Expression CreateReduced()
    {
        switch (MemberInfo) {
            case PropertyInfo propertyInfo:
                return Property(Instance, propertyInfo);

            case FieldInfo fieldInfo:
                return Field(Instance, fieldInfo);

            default:
                throw new TybscriException($"Cannot reduce {MemberInfo} to a CLR expression");
        }
    }
}