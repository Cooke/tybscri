using System.Linq.Expressions;

namespace Tybscri;

public interface ISymbolNode
{
    ParameterExpression LinqExpression { get; }
    
    TybscriType ValueType { get; }
    
    void ResolveTypes(AnalyzeContext context);
}