using System.Linq.Expressions;
using Tybscri.Nodes;

namespace Tybscri;

public class LambdaLiteralNode : IExpressionNode
{
    public IReadOnlyCollection<IStatementNode> Statements { get; }

    private ItSymbol? _itSymbol;
    private readonly List<LambdaParameterNode> _parameters;

    public LambdaLiteralNode(List<LambdaParameterNode> parameters, IReadOnlyCollection<IStatementNode> statements)
    {
        Statements = statements;
        _parameters = parameters;

        Children = statements;
    }

    public TybscriType ExpressionType { get; protected set; } = StandardTypes.Unknown;

    public Scope Scope { get; private set; } = Scope.Empty;

    public IReadOnlyCollection<INode> Children { get; }

    public void SetupScopes(Scope context)
    {
        Scope = context;
        // Cannot setup scopes inside the lambda since that requires the lambda signature, specifically the
        // the presence of the "it" symbol  
    }

    private Scope ResolveStartScope(FuncType lambdaType, Scope scope)
    {
        var hoistedSymbols = Statements.OfType<FunctionNode>().Select(x => (Symbol)new SourceSymbol(x.Name.Text, x));
        var scopeSymbols = hoistedSymbols.ToList();

        if (_parameters.Count == 0 && lambdaType.Parameters.Count == 1) {
            _itSymbol = new ItSymbol(lambdaType.Parameters[0].Type);
            scopeSymbols.Add(_itSymbol);
        }
        else {
            for (var index = 0; index < lambdaType.Parameters.Count; index++) {
                var typeParameter = lambdaType.Parameters[index];
                var lambdaParameter = _parameters[index];
                lambdaParameter.Resolve(new ResolveContext(typeParameter.Type));
                scopeSymbols.Add(new SourceSymbol(lambdaParameter.SymbolName, lambdaParameter));
            }
        }

        return scope.CreateChildScope(scopeSymbols);
    }

    public void Resolve(ResolveContext context)
    {
        if (context.ExpectedType == null || context.ExpectedType is not FuncType expectedFunc) {
            throw new TybscriException("Lambda literals are only supported when a function type is expected");
        }

        ExpressionType = expectedFunc;
        var statementScope = ResolveStartScope(expectedFunc, Scope);
        foreach (var statement in Statements) {
            statement.SetupScopes(statementScope);
            statementScope = statement.Scope;
        }
        
        foreach (var statement in Statements) {
            statement.Resolve(context);
        }
    }

    public Expression ToClrExpression(GenerateContext generateContext)
    {
        // if (_parameterExpression == null) {
        //     throw new InvalidOperationException("Invalid function state");
        // }

        if (ExpressionType is not FuncType funcType) {
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
        private readonly ParameterExpression _itParameterExpression;
        private readonly TybscriType _type;

        public ItSymbol(TybscriType type)
        {
            _type = type;
            _itParameterExpression = Expression.Parameter(type.ClrType, "it");
        }

        public override void ResolveTypes(ResolveContext context)
        {
        }

        public override string Name => "it";

        public override TybscriType ValueType => _type;

        public override ParameterExpression ClrExpression => _itParameterExpression;
    }
}