using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.Symbols;

namespace Tybscri.Nodes;

enum AnalyzeState
{
    NotAnalyzed,
    Analyzing,
    Analyzed
}

public class FunctionNode : IStatementNode, ISymbolDefinitionNode
{
    private AnalyzeState _analyzeState;
    private ParameterExpression? _parameterExpression;

    public FunctionNode(Token name, IReadOnlyCollection<FunctionParameterNode> parameters, BlockNode body)
    {
        Name = name;
        Parameters = parameters;
        Body = body;
        Children = parameters.Concat<INode>(new[] { Body }).ToArray();
    }

    public ParameterExpression SymbolLinqExpression => _parameterExpression ?? throw new InvalidOperationException();

    public Scope Scope { get; private set; } = Scope.Empty;

    public IReadOnlyCollection<FunctionParameterNode> Parameters { get; }

    public IReadOnlyCollection<INode> Children { get; }

    public BlockNode Body { get; }

    public Token Name { get; }

    public TybscriType SymbolType { get; private set; } = UnknownType.Instance;
    
    public string SymbolName => Name.Text;

    public void SetupScopes(Scope scope)
    {
        foreach (var par in Parameters) {
            par.SetupScopes(scope);
        }

        Body.SetupScopes(scope.CreateChildScope(Parameters.Select(x => new SourceSymbol(x.Name.Text, x))));
        Scope = scope;
    }

    public void ResolveSymbolDefinition()
    {
        if (_analyzeState == AnalyzeState.Analyzed) {
            return;
        }

        if (_analyzeState == AnalyzeState.Analyzing) {
            this._analyzeState = AnalyzeState.Analyzed;

            // context.onDiagnosticMessage?.({
            //   message: "Circular reference in function is currently not allowed",
            //   severity: DiagnosticSeverity.Error,
            //   span: this.span,
            // });

            SymbolType = new FuncType(StandardTypes.Unknown,
                Parameters.Select((x) => new FuncParameter(x.Name.Text, x.SymbolType)));
            return;
        }

        _analyzeState = AnalyzeState.Analyzing;
        foreach (var par in Parameters) {
            par.Resolve(new ResolveContext(null));
        }

        Body.Resolve(new ResolveContext(null));

        if (_analyzeState != AnalyzeState.Analyzing) {
            // Analyzed already done in a circular analyze
            return;
        }

        var allReturns = FindReturns(Body).Concat(new[] { Body.ValueType });
        var returnType = UnionType.Create(allReturns.ToArray());

        _analyzeState = AnalyzeState.Analyzed;
        SymbolType = new FuncType(returnType, Parameters.Select(p => new FuncParameter(p.Name.Text, p.SymbolType)));
        _parameterExpression = Expression.Parameter(SymbolType.ClrType, Name.Text);
    }

    public void Resolve(ResolveContext context)
    {
        ResolveSymbolDefinition();
    }

    private IEnumerable<TybscriType> FindReturns(INode node)
    {
        if (node is FunctionNode || node is LambdaLiteralNode) {
            yield break;
        }

        if (node is ReturnNode nodeExpression) {
            yield return nodeExpression.ReturnValue?.ValueType ?? UnknownType.Instance;
        }

        foreach (var child in node.Children) {
            foreach (var innerReturn in FindReturns(child)) {
                yield return innerReturn;
            }
        }
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        if (_parameterExpression == null) {
            throw new InvalidOperationException("Invalid function state");
        }

        if (SymbolType is not FuncType funcType) {
            throw new InvalidOperationException("Cannot compile function");
        }

        var clrReturnType = funcType.ReturnType.ClrType;
        var returnLabel = Expression.Label(clrReturnType, "LastFuncStatement");
        var innerGenerateContext = generateContext with { ReturnLabel = returnLabel };
        Expression funcBlock = Body.ValueType == NeverType.Instance
            ? Expression.Block(Body.GenerateLinqExpression(innerGenerateContext),
                Expression.Label(returnLabel,
                    Expression.Throw(Expression.New(typeof(InvalidOperationException)), clrReturnType)))
            : Expression.Label(returnLabel, Body.GenerateLinqExpression(innerGenerateContext));
        var lambdaExpression = Expression.Lambda(funcBlock, Parameters.Select(x => x.SymbolLinqExpression));
        return Expression.Assign(_parameterExpression, lambdaExpression);
    }
}

public class FunctionParameterNode : INode, ISymbolDefinitionNode
{
    private ParameterExpression? _linqExpression;
    private readonly ITypeNode _typeNode;

    public FunctionParameterNode(Token name, ITypeNode type)
    {
        Name = name;
        _typeNode = type;
        Children = new[] { type };
    }

    public Scope Scope { get; private set; } = Scope.Empty;

    public IReadOnlyCollection<INode> Children { get; }

    public Token Name { get; }

    public string SymbolName => Name.Text;

    public void SetupScopes(Scope scope)
    {
        _typeNode.SetupScopes(scope);
        Scope = scope;
    }

    public TybscriType SymbolType => _typeNode.Type;

    public void ResolveSymbolDefinition()
    {
        _typeNode.Resolve(new ResolveContext(null));
        _linqExpression = Expression.Parameter(SymbolType.ClrType, Name.Text);
    }

    public void Resolve(ResolveContext context)
    {
        ResolveSymbolDefinition();
    }

    public Expression ToLinqExpression(GenerateContext generateContext)
    {
        return _linqExpression ?? throw new InvalidOperationException();
    }

    public ParameterExpression SymbolLinqExpression => _linqExpression ?? throw new InvalidOperationException();
}