using System.Linq.Expressions;

namespace Tybscri.Symbols;

public class SourceSymbol : ISymbol
{
    private readonly ISymbolDefinitionNode _node;

    public SourceSymbol(string name, ISymbolDefinitionNode node)
    {
        Name = name;
        _node = node;
    }

    public TybscriType ValueType => _node.SymbolType;

    public string Name { get; }

    public Expression LinqExpression => _node.LinqExpression;

    public void Resolve()
    {
        _node.ResolveSymbolDefinition();
    }
}