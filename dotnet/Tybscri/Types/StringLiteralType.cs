namespace Tybscri;

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