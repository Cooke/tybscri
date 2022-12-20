using System.Collections.Immutable;
using System.Linq.Expressions;
using System.Text.Json;
using System.Text.Json.Serialization;
using Tybscri.Common;
using Tybscri.TypeMapping;
using Tybscri.TypeSerialization;
using static Tybscri.Common.StandardTypes;

namespace Tybscri;

[JsonConverter(typeof(JsonEnvironmentConverter))]
public partial record Environment(IReadOnlyCollection<EnvironmentSymbol> Symbols,
    ObjectDefinitionType CollectionLiteralDefinition,
    ObjectDefinitionType BooleanDefinition,
    ParameterExpression GlobalsExpression,
    TypeMappings TypeMappings)
{
    public static Environment Standard { get; } = new Environment(
        new EnvironmentSymbol[]
        {
            new("List", ListDefinition), new("Number", NumberDefinition),
            new("Boolean", StandardTypes.BooleanDefinition), new("String", StringDefinition),
            new("Null", NullDefinition), new("Void", VoidDefinition), new("Never", NeverDefinition),
            new("Any", AnyDefinition)
        }.ToList().AsReadOnly(), ListDefinition, StandardTypes.BooleanDefinition,
        Expression.Parameter(typeof(object)),
        new TypeMappings(new Dictionary<Type, DefinitionType>
        {
            { typeof(double), NumberDefinition },
            { typeof(int), NumberDefinition },
            { typeof(bool), StandardTypes.BooleanDefinition },
            { typeof(string), StringDefinition },
            { typeof(List<>), ListDefinition },
            { typeof(object), AnyDefinition },
            { typeof(void), VoidDefinition }
        }));
}

public class JsonEnvironmentConverter : JsonConverter<Environment>
{
    public override Environment? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        throw new NotImplementedException();
    }

    public override void Write(Utf8JsonWriter writer, Environment value, JsonSerializerOptions options)
    {
        var data = new EnvironmentData(value);
        JsonSerializer.Serialize(writer, data, options);
    }
}

public record EnvironmentSymbol(string Name, TybscriType Type, Expression Expression)
{
    public EnvironmentSymbol(string name, TybscriType type) : this(name, type,
        Expression.Constant(null, typeof(object)))
    {
    }
}