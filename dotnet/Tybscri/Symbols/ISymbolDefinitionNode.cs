using System.Linq.Expressions;

namespace Tybscri.Symbols;

public interface ISymbolDefinitionNode
{
    ParameterExpression SymbolLinqExpression { get; }
    
    TybscriType SymbolType { get; }
    
    String SymbolName { get; }
    
    void ResolveSymbolDefinition();
}