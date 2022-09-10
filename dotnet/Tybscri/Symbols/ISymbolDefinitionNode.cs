using System.Linq.Expressions;

namespace Tybscri.Symbols;

public interface ISymbolDefinitionNode
{
    ParameterExpression LinqExpression { get; }
    
    TybscriType SymbolType { get; }
    
    String SymbolName { get; }
    
    void ResolveSymbolDefinition();
}