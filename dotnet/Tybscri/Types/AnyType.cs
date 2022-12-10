namespace Tybscri;

public class AnyType : TybscriType
{
    public static readonly AnyType Instance = new AnyType();

    private AnyType()
    {
    }

    public override Type ClrType => typeof(object);

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return ArraySegment<TybscriMember>.Empty;
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return true;
    }

    public override TResult Visit<TResult>(TybscriTypeVisitor<TResult> visitor)
    {
        return visitor.VisitAny(this);
    }
}