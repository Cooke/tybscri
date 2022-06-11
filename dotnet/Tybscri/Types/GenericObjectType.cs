namespace Tybscri;

public class GenericObjectType : ObjectType
{
    public IReadOnlyCollection<TypeParameter> TypeParameters { get; }

    public IReadOnlyCollection<TybscriType> TypeArguments { get; }

    public GenericObjectType(Type clrType,
        IReadOnlyCollection<TypeParameter> typeParameters,
        IReadOnlyCollection<TybscriType> typeArguments,
        Lazy<IReadOnlyCollection<TybscriMember>> lazyMembers) : base(clrType, lazyMembers)
    {
        TypeParameters = typeParameters;
        TypeArguments = typeArguments;
    }

    public TybscriType CreateType(params TybscriType[] typeArguments)
    {
        if (typeArguments.Length != TypeParameters.Count) {
            throw new InvalidOperationException("Generic type is not in a valid state");
        }

        return CreateType(TypeParameters.Zip(typeArguments, (p, a) => new TypeAssignment(p, a)));
    }

    public override TybscriType CreateType(IEnumerable<TypeAssignment> typeAssignments)
    {
        var newMembers = Members.All(x => x.CreateMember(typeAssignments) == x)
            ? Members
            : Members.Select(x => x.CreateMember(typeAssignments)).ToArray();

        var newTypeArguments = TypeArguments.Any(x => typeAssignments.Any(y => y.Parameter == x))
            ? TypeArguments.Select(x => typeAssignments.FirstOrDefault(a => a.Parameter == x)?.To ?? x).ToArray()
            : TypeArguments;

        if (ReferenceEquals(newMembers, Members) && ReferenceEquals(newTypeArguments, TypeArguments)) {
            return this;
        }

        var newClrType = ClrType.MakeGenericType(typeAssignments.Select(x => x.To.ClrType).ToArray());

        return new GenericObjectType(newClrType, TypeParameters, newTypeArguments,
            new Lazy<IReadOnlyCollection<TybscriMember>>(newMembers));
    }
}

public record TypeAssignment(TypeParameter Parameter, TybscriType To);

public class TypeParameter : TybscriType
{
    public TypeParameter(String name, Type clrType)
    {
        Name = name;
        ClrType = clrType;
    }

    public String Name { get; init; }

    public override Type ClrType { get; }

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return ArraySegment<TybscriMember>.Empty;
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        throw new NotImplementedException();
    }
}