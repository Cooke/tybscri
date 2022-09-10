using System.Linq.Expressions;
using System.Reflection;
using Tybscri.Common;

namespace Tybscri.Nodes;

public class CollectionLiteralNode : IExpressionNode
{
    public CollectionLiteralNode(IReadOnlyCollection<IExpressionNode> expressions)
    {
        Expressions = expressions;
    }

    public TybscriType? ItemType { get; private set; }

    public TybscriType? ListType { get; private set; }

    public IReadOnlyCollection<IExpressionNode> Expressions { get; }

    public Scope Scope { get; private set; } = Scope.Empty;

    public IReadOnlyCollection<INode> Children => Expressions;

    public TybscriType ValueType => ListType ?? throw new InvalidOperationException();

    public void SetupScopes(Scope scope)
    {
        Scope = scope;
        foreach (var exp in Expressions) {
            exp.SetupScopes(scope);
        }
    }

    public void Resolve(ResolveContext context)
    {
        foreach (var expression in Expressions) {
            expression.Resolve(context);
        }

        ItemType = UnionType.Create(Expressions.Select(x => x.ValueType).ToArray());
        ListType = StandardTypes.List.CreateType(ItemType);
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        if (ListType == null || ItemType == null) {
            throw new InvalidOperationException("No list type determined");
        }

        var listConstructor = ListType.ClrType.GetConstructor(Type.EmptyTypes);
        if (listConstructor == null) {
            throw new InvalidOperationException("Invalid list literal constructor");
        }

        return Expression.ListInit(Expression.New(listConstructor),
            Expressions.Select(x => Expression.Convert(x.GenerateLinqExpression(generateContext), ItemType.ClrType)));
    }
}