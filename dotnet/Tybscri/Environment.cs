using System.Linq.Expressions;

namespace Tybscri;

public record Environment(IReadOnlyCollection<EnvironmentSymbol> Symbols,
    ObjectDefinitionType CollectionDefinition,
    ParameterExpression Expression)
{
}

public record EnvironmentSymbol(string Name, TybscriType Type, Expression Expression)
{
}