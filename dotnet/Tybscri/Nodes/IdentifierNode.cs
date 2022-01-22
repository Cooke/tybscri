using System.Linq.Expressions;

namespace Tybscri.Nodes;

internal class IdentifierNode : Node
{
    private Symbol? _symbol;
    public string Name { get; }

    public IdentifierNode(Token token)
    {
        Name = token.Text;
    }

    public override void ResolveTypes(CompileContext context, TybscriType? expectedType)
    {
        _symbol = Scope.GetLast(Name);
        _symbol?.ResolveTypes(context);
        ValueType = _symbol?.ValueType ?? StandardTypes.Unknown;
    }

    public override Expression ToClrExpression()
    {
        if (_symbol == null) {
            throw new InvalidOperationException("Unknown identifier");
        }

        return _symbol.ClrExpression;
    }
}