using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Symbols;

namespace Tybscri.Nodes;

public class IdentifierNode : IExpressionNode
{
    private ISymbol? _symbol;

    public IdentifierNode(Token token)
    {
        Name = token.Text;
    }

    public string Name { get; }

    public IReadOnlyCollection<INode> Children => ArraySegment<INode>.Empty;

    public Scope Scope { get; private set; } = Scope.Empty;

    public TybscriType ValueType { get; private set; } = UnknownType.Instance;

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
        _symbol!.Resolve();
        ValueType = _symbol!.ValueType;
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        if (_symbol == null) {
            throw new TybscriException($"Unknown identifier: {Name}");
        }

        return _symbol.LinqExpression;
    }
}