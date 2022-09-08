namespace Tybscri.Nodes;

public class LiteralTypeNode : TypeNode
{
    public LiteralTypeNode(TybscriType type)
    {
        Type = type;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
    }

    public override TybscriType Type { get; }
}