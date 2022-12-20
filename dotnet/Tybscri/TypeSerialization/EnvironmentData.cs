using System.Text.Json;
using System.Text.Json.Serialization;
using Tybscri.Common;

namespace Tybscri.TypeSerialization;

public record EnvironmentData(IReadOnlyCollection<EnvironmentSymbolData> Symbols,
    String CollectionDefinition,
    String BooleanDefinition)
{
    public EnvironmentData(Environment environment) : this(
        environment.Symbols.Select(s => new EnvironmentSymbolData(s.Name, TypeData.Create(s.Type))).ToArray(),
        environment.CollectionLiteralDefinition.Name, environment.BooleanDefinition.Name)
    {
    }
}

public record EnvironmentSymbolData(string Name, TypeData Type);

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TypeKind
{
    ObjectDefinition,
    Object,
    Union,
    Func,
    Literal,
    TypeReference,
    VoidDefinition,
    NeverDefinition,
    AnyDefinition
}

public record ObjectTypeDefinitionData(string Name,
    string? Base,
    IReadOnlyCollection<MemberData> Members,
    IReadOnlyCollection<TypeParameterData> TypeParameters) : TypeData
{
    public override TypeKind Kind => TypeKind.ObjectDefinition;
}

[JsonConverter(typeof(TypeDataConverter))]
public abstract record TypeData
{
    private static readonly MapperTypeVisitor MapperTypeVisitorInstance = new MapperTypeVisitor();

    public abstract TypeKind Kind { get; }

    public static TypeData Create(TybscriType argType)
    {
        return argType.Visit(MapperTypeVisitorInstance);
    }

    private class MapperTypeVisitor : TybscriTypeVisitor<TypeData>
    {
        public TypeData VisitFunc(FuncType funcType)
        {
            return new FuncTypeData(
                funcType.Parameters.Select(p => new FuncParameterData(p.Name, Create(p.Type))).ToArray(),
                Create(funcType.ReturnType));
        }

        public TypeData VisitLiteral(LiteralType literalType)
        {
            return new LiteralTypeData(literalType.Value, VisitObjectStatic(literalType.ValueType));
        }

        public TypeData VisitObject(ObjectType objectType)
        {
            return VisitObjectStatic(objectType);
        }

        public TypeData VisitTypeParameter(TypeParameter typeParameter)
        {
            return new TypeReferenceData(typeParameter.Name);
        }

        public TypeData VisitNever(NeverType neverType)
        {
            return new TypeReferenceData(StandardTypes.NeverDefinition.Name);
        }

        public TypeData VisitTypeDefinition(ObjectDefinitionType definition)
        {
            return new ObjectTypeDefinitionData(definition.Name, null,
                definition.InstanceDirectMembers.Select(x =>
                    new MemberData(x.Name, false, Create(x.Type), Array.Empty<TypeParameterData>())).ToList(),
                definition.TypeParameters.Select(x => new TypeParameterData(x.Name, TypeVariance.None)).ToArray());
        }

        public TypeData VisitUnion(UnionType unionType)
        {
            return new UnionTypeData(unionType.Types.Select(Create).ToArray());
        }

        public TypeData VisitUnknown(UnknownType unknownType)
        {
            throw new TybscriException("Unknown type is not supported in the environment");
        }

        public TypeData VisitVoid(VoidType voidType)
        {
            return new TypeReferenceData(StandardTypes.VoidDefinition.Name);
        }

        public TypeData VisitVoidDefinition(VoidDefinitionType voidDefinitionType)
        {
            return new VoidDefinitionTypeData(voidDefinitionType.Name);
        }

        public TypeData VisitNeverDefinition(NeverDefinitionType neverDefinitionType)
        {
            return new NeverDefinitionTypeData(neverDefinitionType.Name);
        }

        public TypeData VisitAny(AnyType anyType)
        {
            return new TypeReferenceData(StandardTypes.AnyDefinition.Name);
        }

        public TypeData VisitAnyDefinition(AnyDefinitionType anyDefinitionType)
        {
            return new AnyDefinitionTypeData(anyDefinitionType.Name);
        }

        private static ObjectTypeData VisitObjectStatic(ObjectType objectType)
        {
            return new ObjectTypeData(objectType.Definition.Name, objectType.TypeArguments.Select(Create).ToArray());
        }
    }
}

public class TypeDataConverter : JsonConverter<TypeData>
{
    public override TypeData? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        throw new NotImplementedException();
    }

    public override void Write(Utf8JsonWriter writer, TypeData value, JsonSerializerOptions options)
    {
        JsonSerializer.Serialize(writer, (object)value, options);
    }
}

public record NeverDefinitionTypeData(string Name) : TypeData
{
    public override TypeKind Kind => TypeKind.NeverDefinition;
}

internal record AnyDefinitionTypeData(string Name) : TypeData
{
    public override TypeKind Kind => TypeKind.AnyDefinition;
}

public record VoidDefinitionTypeData(string Name) : TypeData
{
    public override TypeKind Kind => TypeKind.VoidDefinition;
}

public record UnionTypeData(IReadOnlyCollection<TypeData> Types) : TypeData
{
    public override TypeKind Kind => TypeKind.Union;
}

public record FuncTypeData(IReadOnlyCollection<FuncParameterData> Parameters, TypeData ReturnType) : TypeData
{
    public override TypeKind Kind => TypeKind.Func;
}

public record FuncParameterData(string Name, TypeData Type);

public record LiteralTypeData(object Value, ObjectTypeData ValueType) : TypeData
{
    public override TypeKind Kind => TypeKind.Literal;
}

public record ObjectTypeData(string DefinitionName, IReadOnlyCollection<TypeData> TypeArguments) : TypeData
{
    public override TypeKind Kind => TypeKind.Object;
}

public record MemberData(string Name,
    bool Settable,
    TypeData Type,
    IReadOnlyCollection<TypeParameterData> TypeParameters)
{
}

public record TypeReferenceData(string Name) : TypeData
{
    public override TypeKind Kind => TypeKind.TypeReference;
}

public record TypeParameterData(string Name, TypeVariance Variance)
{
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TypeVariance
{
    None,
    In,
    Out
}