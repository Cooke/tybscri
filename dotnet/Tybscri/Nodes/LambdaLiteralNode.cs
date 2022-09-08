using System.Linq.Expressions;
using Tybscri.Nodes;

namespace Tybscri;

public class LambdaLiteralNode : Node
{
    public IReadOnlyCollection<Node> Statements { get; }

    private readonly ItSymbol? _itSymbol;
    private readonly List<IdentifierDefinitionNode> _parameters;

    public LambdaLiteralNode(List<IdentifierDefinitionNode> parameters, IReadOnlyCollection<Node> statements) :
        base(statements)
    {
        Statements = statements;
        _parameters = parameters;
        _itSymbol = parameters.Count == 0 ? new ItSymbol(this) : null;
    }

    public override void SetupScopes(Scope scope)
    {
        var hoistedSymbols = Statements.OfType<FunctionNode>().Select(x => (Symbol)new SourceSymbol(x.Name.Text, x));
        var scopeSymbols = hoistedSymbols.ToList();

        if (_itSymbol != null) {
            scopeSymbols.Add(_itSymbol);
        }
        else {
            scopeSymbols.AddRange(_parameters.Select(p => new SourceSymbol(p.Name, p)));
        }

        var blockScope = scope.CreateChildScope(scopeSymbols);

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
            throw new TybscriException("Lambda literals are only supported when a function type is expected");
        }

        ValueType = expectedFunc;

        // _itSymbol?.ResolveTypes(context);
        if (_itSymbol == null) {
            for (var index = 0; index < expectedFunc.Parameters.Count; index++) {
                var parameter = expectedFunc.Parameters[index];
                _parameters[index].SetType(parameter.Type);
            }
        }

        foreach (var statement in Statements) {
            statement.ResolveTypes(context with { ExpectedType = expectedFunc.ReturnType });
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
            _itSymbol != null && funcType.Parameters.Count == 1
                ? new[] { _itSymbol.ClrExpression }.ToList()
                : _parameters.Select(x => x.ToClrExpression(generateContext)).ToList());
        return lambdaExpression;
    }

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
            _itParameterType ?? throw new TybscriException("Missing it parameter type");

        public override ParameterExpression ClrExpression =>
            _itParameterExpression ?? throw new TybscriException("No it parameter");
    }
}