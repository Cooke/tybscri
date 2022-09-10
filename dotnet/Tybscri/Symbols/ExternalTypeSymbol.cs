using System.Linq.Expressions;
using Tybscri.LinqExpressions;

namespace Tybscri.Symbols;

public class ExternalTypeSymbol : ISymbol, ITypeSymbol
{
    public TybscriType Type { get; }

    public ExternalTypeSymbol(TybscriType type, string name, TybscriType valueType)
    {
        Type = type;
        Name = name;
        ValueType = valueType;
        LinqExpression = new TybscriTypeExpression(type);
    }

    public void Resolve()
    {
    }

    public TybscriType ValueType { get; }
    
    public string Name { get; }
    
    public Expression LinqExpression { get; }
}