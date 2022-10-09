namespace Tybscri;

public class ObjectType : TybscriType
{
    private readonly Lazy<IReadOnlyCollection<TybscriMember>> _directMembers;
    public ObjectDefinitionType Definition { get; }
    public IReadOnlyCollection<TybscriType> TypeArguments { get; }

    public override Type ClrType { get; }

    public IReadOnlyCollection<TybscriMember> DirectMembers => _directMembers.Value;

    public string Name => Definition.Name;

    public ObjectType(ObjectDefinitionType definition, IReadOnlyCollection<TybscriType> typeArguments)
    {
        Definition = definition;
        TypeArguments = typeArguments;

        if (typeArguments.Count > 0) {
            if (!definition.InstanceClrType.IsGenericTypeDefinition) {
                throw new TybscriException("Type parameters are not allowed for non generic type");
            }

            var typeAssignments = definition.TypeParameters.Zip(typeArguments, (p, a) => new TypeAssignment(p, a));

            _directMembers = new Lazy<IReadOnlyCollection<TybscriMember>>(() =>
            {
                var newMembers = DirectMembers.All(x => x.CreateMember(typeAssignments) == x)
                    ? DirectMembers
                    : DirectMembers.Select(x => x.CreateMember(typeAssignments)).ToArray();
                return newMembers;
            });

            ClrType = Definition.InstanceClrType.MakeGenericType(typeArguments.Select(x => x.ClrType).ToArray());
        }
        else {
            _directMembers = new Lazy<IReadOnlyCollection<TybscriMember>>(() => Definition.InstanceDirectMembers);
            ClrType = Definition.InstanceClrType;
        }
    }

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return DirectMembers.Where(x => x.Name == memberName).ToArray();
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return ClrType.IsAssignableFrom(source.ClrType);
    }

    public override TResult Visit<TResult>(TybscriTypeVisitor<TResult> visitor)
    {
        return visitor.VisitObject(this);
    }

    public override TybscriType AssignTypes(IEnumerable<TypeAssignment> typeAssignments)
    {
        return new ObjectType(Definition,
            TypeArguments.Select(arg => typeAssignments.FirstOrDefault(ass => ass.Parameter == arg)?.To ?? arg)
                .ToArray());
    }
}