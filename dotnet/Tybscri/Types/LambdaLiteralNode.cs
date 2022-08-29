using System.Linq.Expressions;
using Tybscri.Nodes;

namespace Tybscri;

public class LambdaLiteralNode : Node
{
    public IReadOnlyCollection<Node> Statements { get; }
    
    private TybscriType _itParameterType = UnknownType.Instance;
    private readonly Symbol _itParameterSymbol;
    private readonly List<ParameterExpression> _parameters = new List<ParameterExpression>();

    public LambdaLiteralNode(IReadOnlyCollection<Node> statements) : base(statements)
    {
        Statements = statements;
        _itParameterSymbol = new ExternalSymbol(() => _parameters.First(), () => _itParameterType, "it");
    }

    public override void SetupScopes(Scope scope)
    {
        var hoistedScopeSymbols = Statements
            .OfType<Function>()
            .Select(x => new SourceSymbol(x.Name.Text, x))
            .ToArray();
        
        var blockScope = scope.CreateChildScope(
                hoistedScopeSymbols.Concat(new []{ _itParameterSymbol })
            );

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
            throw new CompileException("Lambda literals are currently only supported when a function type is expected");
        }

        ValueType = expectedFunc;
        _itParameterType = expectedFunc.Parameters.FirstOrDefault()?.Type ?? StandardTypes.Never;
        _parameters.Add(Expression.Parameter(_itParameterType.ClrType, "it"));
        
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
        
        var body = Expression.Block(
            Statements.Select(x => x.ToClrExpression(generateContext)));
        // Expression funcBlock = Body.ValueType == NeverType.Instance
        //     ? Expression.Block(Body.ToClrExpression(innerGenerateContext),
        //         Expression.Label(returnLabel,
        //             Expression.Throw(Expression.New(typeof(InvalidOperationException)), clrReturnType)))
        //     : Expression.Label(returnLabel, Body.ToClrExpression(innerGenerateContext));
        var lambdaExpression = Expression.Lambda(body, _parameters);
        return lambdaExpression;
    }
}