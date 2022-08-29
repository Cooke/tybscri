using System.Collections.Immutable;
using System.Xml;

namespace Tybscri;

public record Scope
{
    public static readonly Scope Empty = new Scope();

    private readonly Scope? _parent = null;
    private readonly ImmutableList<Symbol> _symbols = ImmutableList<Symbol>.Empty;

    public Scope()
    {
    }

    public Scope(IEnumerable<Symbol> symbols) : this(null, symbols)
    {
    }

    private Scope(Scope? parent, IEnumerable<Symbol> symbols)
    {
        _parent = parent;
        _symbols = symbols.ToImmutableList();
    }

    public Symbol? ResolveLast(string name)
    {
        return _symbols.Find(x => x.Name == name) ?? _parent?.ResolveLast(name);
    }

    public Scope CreateChildScope(IEnumerable<Symbol> symbols)
    {
        return new Scope(this, symbols);
    }

    public Scope WithSymbol(SourceSymbol sourceSymbol)
    {
        return new Scope(_parent, _symbols.Add(sourceSymbol));
    }
}