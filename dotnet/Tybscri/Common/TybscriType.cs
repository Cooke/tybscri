using System.Linq.Expressions;
using System.Reflection;
using Tybscri.Utils;

namespace Tybscri;

public abstract class TybscriType
{
    public abstract Type ClrType { get; }

    public abstract IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName);
    
    public abstract bool IsAssignableFrom(TybscriType source);
}

public class FuncType : TybscriType
{
    public TybscriType ReturnType { get; }

    public override Type ClrType { get; }

    public IReadOnlyList<FuncParameter> Parameters { get; }

    public FuncType(TybscriType returnType, IEnumerable<FuncParameter> parameters)
    {
        ReturnType = returnType;
        Parameters = parameters.ToArray();
        ClrType = Expression.GetFuncType(Parameters.Select(x => x.Type.ClrType).Concat(new[] { ReturnType.ClrType })
            .ToArray());
    }

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return ArraySegment<TybscriMember>.Empty;
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return false;
    }
}

public class FuncParameter
{
    public string Name { get; }
    public TybscriType Type { get; }

    public FuncParameter(string name, TybscriType type)
    {
        Name = name;
        Type = type;
    }
}

public class TybscriMember
{
    public TybscriMember(string name, TybscriType type, MemberInfo memberInfo)
    {
        Name = name;
        Type = type;
        MemberInfo = memberInfo;
    }

    public TybscriType Type { get; }

    public MemberInfo MemberInfo { get; }

    public string Name { get; }
}

public class UnknownType : TybscriType
{
    public static readonly UnknownType Instance = new UnknownType();

    private UnknownType()
    {
    }

    public override Type ClrType =>
        throw new InvalidOperationException("A CLR type cannot be obtained from an unknown type");

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return ArraySegment<TybscriMember>.Empty;
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return false;
    }
}

public class ObjectType : TybscriType
{
    private readonly Lazy<IReadOnlyCollection<TybscriMember>> _lazyMembers;

    public override Type ClrType { get; }

    public ObjectType(Type clrType, Lazy<IReadOnlyCollection<TybscriMember>> lazyMembers)
    {
        _lazyMembers = lazyMembers;
        ClrType = clrType;
    }

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return _lazyMembers.Value.Where(x => x.Name == memberName).ToArray();
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return ClrType.IsAssignableFrom(source.ClrType);
    }
}

public class StringLiteralType : TybscriType
{
    public string Value { get; }
    
    public override Type ClrType => typeof(string);

    public StringLiteralType(string value)
    {
        Value = value;
    }

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return StandardTypes.String.FindMembersByName(memberName);
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return source is StringLiteralType slt && slt.Value == Value;
    }
}

public class NumberLiteralType : TybscriType
{
    public double Value { get; }
    
    public override Type ClrType => typeof(double);

    public NumberLiteralType(double value)
    {
        Value = value;
    }

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return StandardTypes.Number.FindMembersByName(memberName);
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        // ReSharper disable once CompareOfFloatsByEqualityOperator
        return source is NumberLiteralType nlt && nlt.Value == Value;
    }
}

public class BooleanLiteralType : TybscriType
{
    public bool Value { get; }

    public override Type ClrType { get; } = typeof(bool);

    public BooleanLiteralType(bool value)
    {
        Value = value;
    }

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        throw new NotImplementedException();
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return source is BooleanLiteralType blt && blt.Value == Value;
    }
}