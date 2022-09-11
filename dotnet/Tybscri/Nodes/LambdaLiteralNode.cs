using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Nodes;
using Tybscri.Symbols;

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

    public TybscriType ValueType { get; protected set; } = StandardTypes.Unknown;

    public Scope Scope { get; private set; } = Scope.Empty;

    public IReadOnlyCollection<INode> Children { get; }

    public void SetupScopes(Scope context)
    {
        Scope = context;
        // Cannot setup scopes inside the lambda since that requires the lambda signature, specifically the
        // the presence of the "it" symbol  
    }

    private List<ISymbol> ResolveStartScope(FuncType lambdaType)
    {
        var parameterSymbols = new List<ISymbol>();

        if (_parameters.Count == 0 && lambdaType.Parameters.Count == 1) {
            _itSymbol = new ItSymbol(lambdaType.Parameters[0].Type);
            parameterSymbols.Add(_itSymbol);
        }
        else {
            for (var index = 0; index < lambdaType.Parameters.Count; index++) {
                var typeParameter = lambdaType.Parameters[index];
                var lambdaParameter = _parameters[index];
                lambdaParameter.Resolve(new ResolveContext(typeParameter.Type));
                parameterSymbols.Add(new SourceSymbol(lambdaParameter.SymbolName, lambdaParameter));
            }
        }

        return parameterSymbols;
    }

    public void Resolve(ResolveContext context)
    {
        if (context.ExpectedType == null || context.ExpectedType is not FuncType expectedFunc) {
            throw new TybscriException("Lambda literals are only supported when a function type is expected");
        }

        ValueType = expectedFunc;
        var parameterSymbols = ResolveStartScope(expectedFunc);
        BodyUtils.SetupScopes(Statements, Scope.CreateChildScope(parameterSymbols));

        foreach (var statement in Statements) {
            statement.Resolve(context);
        }
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        // if (_parameterExpression == null) {
        //     throw new InvalidOperationException("Invalid function state");
        // }

        if (ValueType is not FuncType funcType) {
            throw new InvalidOperationException("Cannot compile function");
        }

        var body = BodyUtils.GenerateLinqExpression(Statements, funcType.ReturnType.ClrType);
        var parameters = _itSymbol != null && funcType.Parameters.Count == 1
            ? new[] { _itSymbol.ParameterExpression }.ToList()
            : _parameters.Select(x => x.ToLinqExpression(generateContext)).ToList();
        return Expression.Lambda(body, parameters);
    }

    private class ItSymbol : ISymbol
    {
        private readonly TybscriType _type;

        public ItSymbol(TybscriType type)
        {
            _type = type;
            ParameterExpression = Expression.Parameter(type.ClrType, "it");
        }

        public void Resolve()
        {
        }

        public string Name => "it";

        public TybscriType ValueType => _type;

        public Expression LinqExpression => ParameterExpression;

        public ParameterExpression ParameterExpression { get; }
    }
}