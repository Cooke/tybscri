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
}