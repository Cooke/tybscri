using Tybscri.Common;
using Tybscri.Symbols;

namespace Tybscri.Nodes;

public class IdentifierTypeNode : ITypeNode
{
    private ISymbol? _symbol;
    private TybscriType? _type;

    public IdentifierTypeNode(Token identifier)
    {
        Identifier = identifier;
    }

    public Token Identifier { get; }

    public Scope Scope { get; private set; } = Scope.Empty;

    public IReadOnlyCollection<INode> Children => ArraySegment<INode>.Empty;

    public void SetupScopes(Scope scope)
    {
        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
        _symbol = Scope.ResolveLast(Identifier.Text);
        if (_symbol == null) {
            throw new TybscriException($"Unknown symbol {Identifier.Text}");
        }
        
        _symbol.Resolve();
        if (_symbol is not ITypeSymbol typeSymbol) {
            throw new TybscriException($"Symbol {Identifier.Text} is not a type");
        }

        _type = typeSymbol.Type;
    }

    public TybscriType Type => _type ?? throw new TybscriException("Unresolved type");
}