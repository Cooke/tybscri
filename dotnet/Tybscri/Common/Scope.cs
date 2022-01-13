using System.Collections.Immutable;
using System.Xml;

namespace Tybscri;

public record Scope
{
    public static readonly Scope Empty = new Scope();

    private readonly ImmutableList<Symbol> _symbols = ImmutableList<Symbol>.Empty;

    public Scope()
    {
    }

    public Scope(IEnumerable<ExternalSymbol> symbols)
    {
        _symbols = symbols.Cast<Symbol>().ToImmutableList();
    }

    public Symbol? GetLast(string name)
    {
        return _symbols.Find(x => x.Name == name);
    }
}