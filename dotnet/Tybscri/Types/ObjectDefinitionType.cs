namespace Tybscri;

public sealed class ObjectDefinitionType : DefinitionType
{
    private readonly Lazy<IReadOnlyCollection<TybscriMember>> _lazyInstanceDirectMembers;

    public override string Name { get; }

    public Type InstanceClrType { get; }

    public IReadOnlyCollection<TypeParameter> TypeParameters { get; }

    public ObjectDefinitionType(string name,
        Type instanceClrType,
        IReadOnlyCollection<TypeParameter> typeParameters,
        Lazy<IReadOnlyCollection<TybscriMember>> lazyInstanceDirectMembers)
    {
        _lazyInstanceDirectMembers = lazyInstanceDirectMembers;
        Name = name;
        InstanceClrType = instanceClrType;
        TypeParameters = typeParameters;
    }

    public override Type ClrType => typeof(object);

    public IReadOnlyCollection<TybscriMember> InstanceDirectMembers => _lazyInstanceDirectMembers.Value;

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
        return visitor.VisitTypeDefinition(this);
    }

    public override  ObjectType CreateType(params TybscriType[] typeArguments)
    {
        if (typeArguments.Length != TypeParameters.Count) {
            throw new InvalidOperationException("Generic type is not in a valid state");
        }

        return new ObjectType(this, typeArguments);
    }
}