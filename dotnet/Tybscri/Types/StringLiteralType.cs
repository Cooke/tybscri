using Tybscri.Common;

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

    protected bool Equals(StringLiteralType other)
    {
        return Value == other.Value;
    }

    public override bool Equals(object? obj)
    {
        if (ReferenceEquals(null, obj)) return false;
        if (ReferenceEquals(this, obj)) return true;
        if (obj.GetType() != this.GetType()) return false;
        return Equals((StringLiteralType)obj);
    }

    public override int GetHashCode()
    {
        return Value.GetHashCode();
    }

    public static bool operator ==(StringLiteralType? left, StringLiteralType? right)
    {
        return Equals(left, right);
    }

    public static bool operator !=(StringLiteralType? left, StringLiteralType? right)
    {
        return !Equals(left, right);
    }
}