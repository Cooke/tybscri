using System.Collections.Immutable;
using Tybscri.Symbols;

namespace Tybscri.Common;

public record Scope
{
    public static readonly Scope Empty = new Scope();

    private readonly Scope? _parent = null;
    private readonly ImmutableList<ISymbol> _symbols = ImmutableList<ISymbol>.Empty;

    public Scope()
    {
    }

    public Scope(IEnumerable<ISymbol> symbols) : this(null, symbols)
    {
    }

    private Scope(Scope? parent, IEnumerable<ISymbol> symbols)
    {
        _parent = parent;
        _symbols = symbols.ToImmutableList();
    }

    public ISymbol? ResolveLast(string name)
    {
        return _symbols.Find(x => x.Name == name) ?? _parent?.ResolveLast(name);
    }

    public Scope CreateChildScope(IEnumerable<ISymbol> symbols)
    {
        return new Scope(this, symbols);
    }

    public Scope WithSymbol(SourceSymbol sourceSymbol)
    {
        return new Scope(_parent, _symbols.Add(sourceSymbol));
    }
}