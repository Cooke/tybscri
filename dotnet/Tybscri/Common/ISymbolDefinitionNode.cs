using System.Linq.Expressions;

namespace Tybscri;

public interface ISymbolDefinitionNode
{
    ParameterExpression LinqExpression { get; }
    
    TybscriType DefinedType { get; }
    
    void ResolveTypes(AnalyzeContext context);
}