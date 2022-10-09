namespace Tybscri.Common;

public class NeverDefinitionType : DefinitionType
{
    public NeverDefinitionType(string name)
    {
        Name = name;
    }
    
    public override string Name { get; }

    public override Type ClrType { get; } = typeof(object);
    
    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return ArraySegment<TybscriMember>.Empty;
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return false;
    }

    public override TResult Visit<TResult>(TybscriTypeVisitor<TResult> visitor)
    {
        return visitor.VisitNeverDefinition(this);
    }

    public override TybscriType CreateType(params TybscriType[] typeArguments)
    {
        return NeverType.Instance;
    }
}