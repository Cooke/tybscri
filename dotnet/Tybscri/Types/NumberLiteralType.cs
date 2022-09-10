using Tybscri.Common;

namespace Tybscri;

public class NumberLiteralType : TybscriType
{
    public double Value { get; }

    public override Type ClrType => typeof(double);

    public NumberLiteralType(double value)
    {
        Value = value;
    }

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return StandardTypes.Number.FindMembersByName(memberName);
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        // ReSharper disable once CompareOfFloatsByEqualityOperator
        return source is NumberLiteralType nlt && nlt.Value == Value;
    }

    protected bool Equals(NumberLiteralType other)
    {
        return Value.Equals(other.Value);
    }

    public override bool Equals(object? obj)
    {
        if (ReferenceEquals(null, obj)) return false;
        if (ReferenceEquals(this, obj)) return true;
        if (obj.GetType() != this.GetType()) return false;
        return Equals((NumberLiteralType)obj);
    }

    public override int GetHashCode()
    {
        return Value.GetHashCode();
    }

    public static bool operator ==(NumberLiteralType? left, NumberLiteralType? right)
    {
        return Equals(left, right);
    }

    public static bool operator !=(NumberLiteralType? left, NumberLiteralType? right)
    {
        return !Equals(left, right);
    }
}