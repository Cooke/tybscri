namespace Tybscri;

public abstract class TybscriType
{
    public abstract Type GetClrType();
}

public class UnknownType : TybscriType
{
    public static readonly UnknownType Instance = new UnknownType();

    private UnknownType()
    {
    }

    public override Type GetClrType()
    {
        throw new InvalidOperationException("A CLR type cannot be obtained from an unknown type");
    }
}

class ClrWrapperType : TybscriType
{
    public Type ClrType { get; }

    public ClrWrapperType(Type clrType)
    {
        ClrType = clrType;
    }

    public override Type GetClrType()
    {
        return ClrType;
    }
}