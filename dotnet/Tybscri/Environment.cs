using System.Linq.Expressions;

namespace Tybscri;

public record Environment(IReadOnlyCollection<EnvironmentSymbol> Symbols, ParameterExpression Expression)
{
    
}

public record EnvironmentSymbol(string Name, TybscriType Type, Expression Expression)
{
}
