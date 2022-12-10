using System.Collections.Immutable;
using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.TypeMapping;
using static Tybscri.Common.StandardTypes;

namespace Tybscri;

public partial record Environment(IReadOnlyCollection<EnvironmentSymbol> Symbols,
    ObjectDefinitionType CollectionLiteralDefinition,
    ParameterExpression GlobalsExpression,
    TypeMappings TypeMappings)
{
    public static Environment Standard { get; } = new Environment(
        new EnvironmentSymbol[]
        {
            new("List", ListDefinition), new("Number", NumberDefinition), new("Boolean", BooleanDefinition),
            new("String", StringDefinition), new("Null", NullDefinition), new("Void", VoidDefinition),
            new("Never", NeverDefinition), new("Any", AnyDefinition)
        }.ToList().AsReadOnly(), ListDefinition, Expression.Parameter(typeof(object)),
        new TypeMappings(new Dictionary<Type, DefinitionType>
        {
            { typeof(double), NumberDefinition },
            { typeof(int), NumberDefinition },
            { typeof(bool), BooleanDefinition },
            { typeof(string), StringDefinition },
            { typeof(List<>), ListDefinition },
            { typeof(object), AnyDefinition },
            { typeof(void), VoidDefinition }
        }));
}

public record EnvironmentSymbol(string Name, TybscriType Type, Expression Expression)
{
    public EnvironmentSymbol(string name, TybscriType type) : this(name, type,
        Expression.Constant(null, typeof(object)))
    {
    }
}