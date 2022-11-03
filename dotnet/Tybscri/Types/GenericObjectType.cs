namespace Tybscri;

public record TypeAssignment(TypeParameter Parameter, TybscriType To);

public class TypeParameter : TybscriType
{
    public TypeParameter(string name, Type clrType)
    {
        Name = name;
        ClrType = clrType;
    }

    public String Name { get; }

    public override Type ClrType { get; }

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return ArraySegment<TybscriMember>.Empty;
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        throw new NotImplementedException();
    }

    public override TResult Visit<TResult>(TybscriTypeVisitor<TResult> visitor)
    {
        return visitor.VisitTypeParameter(this);
    }
}