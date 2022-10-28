using System.Text.Json;
using System.Text.Json.Serialization;
using Tybscri.Common;

namespace Tybscri.TypeSerialization;

public record EnvironmentData(IReadOnlyCollection<EnvironmentSymbolData> Symbols)
{
    public EnvironmentData(Environment environment) : this(environment.Symbols.Select(s =>
        new EnvironmentSymbolData(s.Name, TypeData.Create(s.Type))).ToArray())
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
    Parameter,
    Never,
    Void,
    VoidDefinition,
    NeverDefinition,
    TypeParameter
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

        public TypeData VisitParameter(TypeParameter typeParameter)
        {
            return new ParameterTypeData(typeParameter.Name);
        }

        public TypeData VisitNever(NeverType neverType)
        {
            return new NeverTypeData();
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
            return new VoidTypeData();
        }

        public TypeData VisitVoidDefinition(VoidDefinitionType voidDefinitionType)
        {
            return new VoidDefinitionTypeData();
        }

        public TypeData VisitNeverDefinition(NeverDefinitionType neverDefinitionType)
        {
            return new NeverDefinitionTypeData();
        }

        private static ObjectTypeData VisitObjectStatic(ObjectType objectType)
        {
            return new ObjectTypeData(objectType.Definition.Name, ArraySegment<Type>.Empty);
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

public record NeverDefinitionTypeData : TypeData
{
    public override TypeKind Kind => TypeKind.NeverDefinition;
}

public record VoidDefinitionTypeData : TypeData
{
    public override TypeKind Kind => TypeKind.VoidDefinition;
}

public record VoidTypeData : TypeData
{
    public override TypeKind Kind => TypeKind.Void;
}

internal record NeverTypeData : TypeData
{
    public override TypeKind Kind => TypeKind.Never;
}

public record ParameterTypeData(string Name) : TypeData
{
    public override TypeKind Kind => TypeKind.Parameter;
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

public record ObjectTypeData(string DefinitionName, IReadOnlyCollection<Type> TypeArguments) : TypeData
{
    public override TypeKind Kind => TypeKind.Object;
}

public record MemberData(string Name,
    bool Settable,
    TypeData Type,
    IReadOnlyCollection<TypeParameterData> TypeParameters)
{
}

public record TypeParameterData(string Name, TypeVariance Variance) : TypeData
{
    public override TypeKind Kind => TypeKind.TypeParameter;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TypeVariance
{
    None,
    In,
    Out
}