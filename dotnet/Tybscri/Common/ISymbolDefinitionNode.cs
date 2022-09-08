using System.Linq.Expressions;

namespace Tybscri;

public interface ISymbolDefinitionNode
{
    ParameterExpression LinqExpression { get; }
    
    TybscriType ValueType { get; }
    
    void ResolveTypes(AnalyzeContext context);
}