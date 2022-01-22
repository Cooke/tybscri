using System.Linq.Expressions;
using System.Reflection;
using Tybscri.Utils;

namespace Tybscri;

public abstract class TybscriType
{
    public abstract Type ClrType { get; }

    public abstract IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName);
}

public class FuncType : TybscriType
{
    public TybscriType ReturnType { get; }

    public override Type ClrType { get; }

    public IReadOnlyCollection<FuncParameter> Parameters { get; }

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
}