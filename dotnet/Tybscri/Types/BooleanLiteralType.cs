namespace Tybscri;

public class BooleanLiteralType : TybscriType
{
    public bool Value { get; }

    public override Type ClrType => typeof(bool);

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

    protected bool Equals(BooleanLiteralType other)
    {
        return Value == other.Value;
    }

    public override bool Equals(object? obj)
    {
        if (ReferenceEquals(null, obj)) return false;
        if (ReferenceEquals(this, obj)) return true;
        if (obj.GetType() != this.GetType()) return false;
        return Equals((BooleanLiteralType)obj);
    }

    public override int GetHashCode()
    {
        return Value.GetHashCode();
    }

    public static bool operator ==(BooleanLiteralType? left, BooleanLiteralType? right)
    {
        return Equals(left, right);
    }

    public static bool operator !=(BooleanLiteralType? left, BooleanLiteralType? right)
    {
        return !Equals(left, right);
    }
}