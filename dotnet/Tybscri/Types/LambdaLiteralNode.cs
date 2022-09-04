using System.Linq.Expressions;
using Tybscri.Nodes;

namespace Tybscri;

public class LambdaLiteralNode : Node
{
    public IReadOnlyCollection<Node> Statements { get; }

    private readonly ItSymbol _itParameterSymbol;
    private readonly List<ParameterExpression> _parameters = new List<ParameterExpression>();

    private class ItSymbol : Symbol
    {
        private readonly LambdaLiteralNode _lambdaLiteralNode;
        private TybscriType? _itParameterType;
        private ParameterExpression? _itParameterExpression;

        public ItSymbol(LambdaLiteralNode lambdaLiteralNode)
        {
            _lambdaLiteralNode = lambdaLiteralNode;
        }

        public override void ResolveTypes(AnalyzeContext context)
        {
            _itParameterType ??= ((FuncType)_lambdaLiteralNode.ValueType).Parameters.FirstOrDefault()?.Type ??
                                 StandardTypes.Never;
            _itParameterExpression ??= Expression.Parameter(_itParameterType.ClrType, "it");
        }

        public override string Name => "it";

        public override TybscriType ValueType =>
            _itParameterType ?? throw new CompileException("Missing it parameter type");

        public override ParameterExpression ClrExpression =>
            _itParameterExpression ?? throw new CompileException("No it parameter");
    }

    public LambdaLiteralNode(IReadOnlyCollection<Node> statements) : base(statements)
    {
        Statements = statements;
        _itParameterSymbol = new ItSymbol(this);
    }

    public override void SetupScopes(Scope scope)
    {
        var hoistedScopeSymbols = Statements.OfType<Function>().Select(x => new SourceSymbol(x.Name.Text, x)).ToArray();

        var blockScope = scope.CreateChildScope(hoistedScopeSymbols.Concat(new[] { (Symbol)_itParameterSymbol }));

        foreach (var statement in Statements) {
            statement.SetupScopes(blockScope);

            //if (statement is VariableDeclarationNode) {
            //    blockScope = blockScope.withSymbols([statement.symbol]);
            // }
        }

        Scope = scope;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        if (context.ExpectedType == null || context.ExpectedType is not FuncType expectedFunc) {
            throw new CompileException("Lambda literals are only supported when a function type is expected");
        }

        ValueType = expectedFunc;

        foreach (var statement in Statements) {
            statement.ResolveTypes(context);
        }
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        // if (_parameterExpression == null) {
        //     throw new InvalidOperationException("Invalid function state");
        // }

        if (ValueType is not FuncType funcType) {
            throw new InvalidOperationException("Cannot compile function");
        }

        var clrReturnType = funcType.ReturnType.ClrType;
        var returnLabel = Expression.Label(clrReturnType, "LastFuncStatement");
        var innerGenerateContext = generateContext with { ReturnLabel = returnLabel };

        var body = Expression.Block(Statements.Select(x => x.ToClrExpression(generateContext)));
        // Expression funcBlock = Body.ValueType == NeverType.Instance
        //     ? Expression.Block(Body.ToClrExpression(innerGenerateContext),
        //         Expression.Label(returnLabel,
        //             Expression.Throw(Expression.New(typeof(InvalidOperationException)), clrReturnType)))
        //     : Expression.Label(returnLabel, Body.ToClrExpression(innerGenerateContext));
        var lambdaExpression = Expression.Lambda(body,
            funcType.Parameters.Count == 1 && _parameters.Count == 0
                ? new[] { _itParameterSymbol.ClrExpression }.ToList()
                : _parameters);
        return lambdaExpression;
    }
}