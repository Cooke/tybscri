using System.Linq.Expressions;
using System.Reflection;

namespace Tybscri.Nodes;

public class CollectionLiteral : Node
{
    public TybscriType? ItemType { get; private set; }

    public TybscriType? ListType { get; private set; }

    public IReadOnlyCollection<Node> Expressions { get; }

    public CollectionLiteral(IReadOnlyCollection<Node> expressions) : base(expressions)
    {
        Expressions = expressions;
    }

    public override void SetupScopes(Scope scope)
    {
        Scope = scope;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        foreach (var expression in Expressions) {
            expression.ResolveTypes(context);
        }

        ItemType = UnionType.Create(Expressions.Select(x => x.ValueType).ToArray());
        ListType = StandardTypes.List.CreateType(ItemType);
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        if (ListType == null || ItemType == null) {
            throw new InvalidOperationException("No list type determined");
        }

        var listConstructor = ListType.ClrType.GetConstructor(Type.EmptyTypes);
        if (listConstructor == null) {
            throw new InvalidOperationException("Invalid list literal constructor");
        }

        return Expression.ListInit(Expression.New(listConstructor),
            Expressions.Select(x => Expression.Convert(x.ToClrExpression(generateContext), ItemType.ClrType)));
    }
}