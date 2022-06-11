namespace Tybscri;

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