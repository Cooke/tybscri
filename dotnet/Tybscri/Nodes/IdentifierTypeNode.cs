namespace Tybscri.Nodes;

public class IdentifierTypeNode : TypeNode
{
    private Symbol? _symbol;

    public IdentifierNode Identifier { get; }

    public IdentifierTypeNode(IdentifierNode identifier)
    {
        Identifier = identifier;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        _symbol = Scope.ResolveLast(Identifier.Name);
        _symbol?.ResolveTypes(context);
    }

    public override TybscriType Type => _symbol?.ValueType ?? StandardTypes.Unknown;
}