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

    public FunctionNode(Token name,
        IReadOnlyCollection<FunctionParameterNode> parameters,
        IReadOnlyCollection<IStatementNode> statements)
    {
        Name = name;
        Parameters = parameters;
        Statements = statements;
        Children = parameters.Concat<INode>(statements).ToArray();
    }

    public ParameterExpression SymbolLinqExpression => _parameterExpression ?? throw new InvalidOperationException();

    public Scope Scope { get; private set; } = Scope.Empty;

    public IReadOnlyCollection<FunctionParameterNode> Parameters { get; }

    public IReadOnlyCollection<IStatementNode> Statements { get; }

    public IReadOnlyCollection<INode> Children { get; }

    public Token Name { get; }

    public TybscriType SymbolType { get; private set; } = UnknownType.Instance;

    public string SymbolName => Name.Text;

    public void SetupScopes(Scope scope)
    {
        Scope = scope;

        foreach (var par in Parameters) {
            par.SetupScopes(scope);
        }

        var startScope = scope.CreateChildScope(Parameters.Select(x => new SourceSymbol(x.Name.Text, x)));
        BodyUtils.SetupScopes(Statements, startScope);
    }

    public void ResolveSymbolDefinition()
    {
        if (_analyzeState == AnalyzeState.Analyzed) {
            return;
        }

        if (_analyzeState == AnalyzeState.Analyzing) {
            this._analyzeState = AnalyzeState.Analyzed;

            SymbolType = new FuncType(StandardTypes.Unknown,
                Parameters.Select((x) => new FuncParameter(x.Name.Text, x.SymbolType)).ToList);
            return;
        }

        _analyzeState = AnalyzeState.Analyzing;
        foreach (var par in Parameters) {
            par.Resolve(new ResolveContext(null));
        }

        foreach (var statement in Statements.OrderBy(x => x is FunctionNode ? 0 : 1)) {
            statement.Resolve(new ResolveContext(null));
        }

        if (_analyzeState != AnalyzeState.Analyzing) {
            // Analyzed already done in a circular analyze
            return;
        }

        _analyzeState = AnalyzeState.Analyzed;

        var returnType = BodyUtils.CalculateReturnType(Statements);
        SymbolType = new FuncType(returnType, Parameters.Select(p => new FuncParameter(p.Name.Text, p.SymbolType)).ToList);
        _parameterExpression = Expression.Parameter(SymbolType.ClrType, Name.Text);
    }

    public void Resolve(ResolveContext context)
    {
        ResolveSymbolDefinition();
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        if (_parameterExpression == null) {
            throw new InvalidOperationException("Invalid function state");
        }

        if (SymbolType is not FuncType funcType) {
            throw new InvalidOperationException("Cannot compile function");
        }

        var body = BodyUtils.GenerateLinqExpression(Statements, funcType.ReturnType.ClrType);
        var parameters = Parameters.Select(x => x.SymbolLinqExpression);
        var lambdaExpression = Expression.Lambda(body, parameters);
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