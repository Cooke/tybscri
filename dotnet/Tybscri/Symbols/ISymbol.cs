using System.Linq.Expressions;

namespace Tybscri.Symbols;

public interface ISymbol
{
    TybscriType ValueType { get; }
    
    string Name { get; }
    
    Expression LinqExpression { get; }
    
    void Resolve();
}