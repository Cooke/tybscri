using System.Linq.Expressions;
using Tybscri.LinqExpressions;

namespace Tybscri;

public class ExternalTypeSymbol : Symbol, ITypeSymbol
{
    public TybscriType Type { get; }

    public ExternalTypeSymbol(TybscriType type, string name, TybscriType valueType)
    {
        Type = type;
        Name = name;
        ValueType = valueType;
        ClrExpression = new TybscriTypeExpression(type);
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        
    }

    public override TybscriType ValueType { get; }
    
    public override string Name { get; }
    
    public override Expression ClrExpression { get; }
}