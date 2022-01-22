using System.Reflection;
using Tybscri.Utils;

namespace Tybscri;

public abstract class TybscriType
{
    public abstract Type ClrType { get; }

    public abstract IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName);
}

public class TybscriMember
{
    public TybscriType Type { get; }

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