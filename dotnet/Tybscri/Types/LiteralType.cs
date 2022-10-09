using Tybscri.Common;

namespace Tybscri;

public class LiteralType : TybscriType
{
    public object Value { get; }

    public ObjectType ValueType { get; }

    public override Type ClrType => ValueType.ClrType;

    public LiteralType(object value, ObjectType valueType)
    {
        Value = value;
        ValueType = valueType;
    }

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return ValueType.FindMembersByName(memberName);
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return source is LiteralType slt && slt.Value.Equals(Value) && slt.ValueType.Equals(ValueType);
    }

    public override TResult Visit<TResult>(TybscriTypeVisitor<TResult> visitor)
    {
        return visitor.VisitLiteral(this);
    }

    public static TybscriType FromClrType(object value) =>
        value switch
        {
            double => new LiteralType(value, StandardTypes.Number),
            float x => new LiteralType((double)x, StandardTypes.Number),
            int x => new LiteralType((double)x, StandardTypes.Number),
            long x => new LiteralType((double)x, StandardTypes.Number),
            string => new LiteralType(value, StandardTypes.String),
            bool => new LiteralType(value, StandardTypes.Boolean),
            _ => throw new NotSupportedException($"Literal types from CLR type {value.GetType()} is not supported")
        };
}