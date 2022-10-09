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
            throw new TybscriException($"Unknown type symbol {Identifier.Text}");
        }
        
        _symbol.Resolve();
        if (_symbol.ValueType is not ObjectDefinitionType definitionType) {
            throw new TybscriException($"Symbol {Identifier.Text} is not a type");
        }

        _type = definitionType.CreateType();
    }

    public TybscriType Type => _type ?? throw new TybscriException("Unresolved type");
}