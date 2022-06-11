namespace Tybscri;

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