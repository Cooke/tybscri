using System.Linq.Expressions;

namespace Tybscri.Symbols;

public class ExternalSymbol : ISymbol
{
    public ExternalSymbol(Expression linqExpression, TybscriType valueType, string name)
    {
        LinqExpression = linqExpression;
        ValueType = valueType;
        Name = name;
    }

    public TybscriType ValueType { get; }

    public string Name { get; }

    public Expression LinqExpression { get; }

    public void Resolve()
    {
    }
}