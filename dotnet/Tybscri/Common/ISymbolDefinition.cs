using System.Linq.Expressions;

namespace Tybscri;

public interface ISymbolDefinition
{
    ParameterExpression ClrExpression { get; }
    
    TybscriType SymbolType { get; }
    
    String SymbolName { get; }
    
    void ResolveSymbol();
}