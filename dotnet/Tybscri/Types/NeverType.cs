namespace Tybscri;

public class NeverType : TybscriType
{
    public static readonly NeverType Instance = new NeverType();

    private NeverType()
    {
    }

    public override Type ClrType =>
        throw new InvalidOperationException("A CLR type cannot be obtained from the never type");

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return ArraySegment<TybscriMember>.Empty;
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return source.Equals(this);
    }
}