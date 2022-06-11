namespace Tybscri;

public class ObjectType : TybscriType
{
    private readonly Lazy<IReadOnlyCollection<TybscriMember>> _lazyMembers;

    public override Type ClrType { get; }

    public IReadOnlyCollection<TybscriMember> Members => _lazyMembers.Value;

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