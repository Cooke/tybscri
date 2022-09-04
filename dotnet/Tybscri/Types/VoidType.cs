namespace Tybscri;

public class VoidType : TybscriType
{
    public static readonly VoidType Instance = new VoidType();

    private VoidType()
    {
    }

    public override Type ClrType => typeof(object);

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return ArraySegment<TybscriMember>.Empty;
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return source.Equals(this);
    }
}