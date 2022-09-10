namespace Tybscri.Nodes;

public class IdentifierTypeNode : TypeNode
{
    private Symbol? _symbol;
    private TybscriType? _type;

    public IdentifierNode Identifier { get; }

    public IdentifierTypeNode(IdentifierNode identifier)
    {
        Identifier = identifier;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        _symbol = Scope.ResolveLast(Identifier.Name);
        if (_symbol == null) {
            throw new TybscriException($"Unknown symbol {Identifier.Name}");
        }
        
        _symbol.ResolveTypes(context);
        if (_symbol is not ITypeSymbol typeSymbol) {
            throw new TybscriException($"Symbol {Identifier.Name} is not a type");
        }

        _type = typeSymbol.Type;
    }

    public override TybscriType Type => _type ?? throw new TybscriException("Unresolved type");
}