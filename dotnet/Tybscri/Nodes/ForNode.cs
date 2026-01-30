using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Interpreter;
using Tybscri.Symbols;

namespace Tybscri.Nodes;

internal class ForNode : IExpressionNode, ISymbolDefinitionNode, IAsyncEvaluatable
{
    private ParameterExpression? _itemLinqExpression;
    private TybscriType _itemType = UnknownType.Instance;
    private SourceSymbol? _itemSymbol;

    public ForNode(Token itemName, IExpressionNode collection, IExpressionNode body)
    {
        ItemName = itemName;
        Collection = collection;
        Body = body;
        Children = new INode[] { Collection, Body };
    }

    public Token ItemName { get; }

    public IExpressionNode Collection { get; }

    public IExpressionNode Body { get; }

    public IReadOnlyCollection<INode> Children { get; }

    public Scope Scope { get; private set; } = Scope.Empty;

    public TybscriType ValueType => VoidType.Instance;

    // ISymbolDefinitionNode implementation for the loop variable
    public ParameterExpression SymbolLinqExpression => _itemLinqExpression ?? throw new InvalidOperationException();

    public TybscriType SymbolType => _itemType;

    public string SymbolName => ItemName.Text;

    public void SetupScopes(Scope scope)
    {
        Collection.SetupScopes(scope);
        // Create a child scope with the item symbol for the body
        _itemSymbol = new SourceSymbol(SymbolName, this);
        var bodyScope = scope.WithSymbol(_itemSymbol);
        Body.SetupScopes(bodyScope);
        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
        Collection.Resolve(context);

        // Infer item type from collection type (List<T> -> T)
        var collectionType = Collection.ValueType;
        if (collectionType is ObjectType objectType &&
            objectType.Definition == StandardTypes.ListDefinition &&
            objectType.TypeArguments.Count > 0)
        {
            _itemType = objectType.TypeArguments.First();
        }
        else
        {
            _itemType = UnknownType.Instance;
        }

        _itemLinqExpression = Expression.Variable(_itemType.ClrType, ItemName.Text);

        Body.Resolve(context);
    }

    public void ResolveSymbolDefinition()
    {
        if (_itemLinqExpression == null)
        {
            throw new TybscriException($"Variable {SymbolName} can not be used before initialization");
        }
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        // Create break and continue labels
        var breakLabel = Expression.Label("break");
        var continueLabel = Expression.Label("continue");

        // Get the collection and create an enumerator
        var collectionExpr = Collection.GenerateLinqExpression(generateContext);
        var enumeratorType = typeof(IEnumerator<>).MakeGenericType(_itemType.ClrType);
        var enumeratorVar = Expression.Variable(enumeratorType, "enumerator");

        // Get the GetEnumerator method
        var getEnumeratorMethod = typeof(IEnumerable<>).MakeGenericType(_itemType.ClrType).GetMethod("GetEnumerator")!;
        var moveNextMethod = typeof(System.Collections.IEnumerator).GetMethod("MoveNext")!;
        var currentProperty = enumeratorType.GetProperty("Current")!;

        // Create the loop body
        var loopBody = Expression.Block(
            Expression.IfThen(
                Expression.Not(Expression.Call(enumeratorVar, moveNextMethod)),
                Expression.Break(breakLabel)
            ),
            Expression.Assign(_itemLinqExpression!, Expression.Property(enumeratorVar, currentProperty)),
            Body.GenerateLinqExpression(generateContext),
            Expression.Label(continueLabel)
        );

        // Create the loop
        var loop = Expression.Loop(loopBody, breakLabel);

        // Create the block that initializes the enumerator and runs the loop
        return Expression.Block(
            new[] { enumeratorVar, _itemLinqExpression! },
            Expression.Assign(enumeratorVar, Expression.Call(collectionExpr, getEnumeratorMethod)),
            loop,
            Expression.Constant(null, typeof(object))
        );
    }

    public async ValueTask<object?> EvaluateAsync(EvalContext context)
    {
        var collectionValue = await ((IAsyncEvaluatable)Collection).EvaluateAsync(context);

        if (collectionValue is System.Collections.IEnumerable enumerable)
        {
            // Create a child scope for the loop body
            var loopContext = context.CreateChildScopeWithLocals();

            foreach (var item in enumerable)
            {
                if (_itemSymbol != null)
                {
                    loopContext.Locals[_itemSymbol] = item;
                }

                try
                {
                    await ((IAsyncEvaluatable)Body).EvaluateAsync(loopContext);
                }
                catch (BreakException)
                {
                    break;
                }
                catch (ContinueException)
                {
                    continue;
                }
            }
        }

        return null;
    }
}
