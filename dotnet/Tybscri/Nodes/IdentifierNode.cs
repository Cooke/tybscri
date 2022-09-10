using System.Linq.Expressions;

namespace Tybscri.Nodes;

public class IdentifierNode : IExpressionNode
{
    private Symbol? _symbol;

    public IdentifierNode(Token token)
    {
        Name = token.Text;
    }

    public string Name { get; }

    public IReadOnlyCollection<INode> Children => ArraySegment<INode>.Empty;

    public Scope Scope { get; private set; } = Scope.Empty;

    public TybscriType ExpressionType { get; private set; } = UnknownType.Instance;

    public void SetupScopes(Scope scope)
    {
        Scope = scope;
        _symbol = Scope.ResolveLast(Name);
        if (_symbol == null) {
            throw new TybscriException($"Unknown symbol {Name}");
        }
    }

    public void Resolve(ResolveContext context)
    {
        _symbol!.ResolveTypes(context);
        ExpressionType = _symbol!.ValueType;
    }

    public Expression ToClrExpression(GenerateContext generateContext)
    {
        if (_symbol == null) {
            throw new TybscriException($"Unknown identifier: {Name}");
        }

        return _symbol.ClrExpression;
    }
}