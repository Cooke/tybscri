using System.Linq.Expressions;
using CookeRpc.AspNetCore.Utils;
using DotNext.Metaprogramming;
using Tybscri.Common;
using Tybscri.Interpreter;
using Tybscri.Symbols;

namespace Tybscri.Nodes;

enum AnalyzeState
{
    NotAnalyzed,
    Analyzing,
    Analyzed
}

public class FunctionNode : IStatementNode, ISymbolDefinitionNode, IAsyncEvaluatable
{
    private AnalyzeState _analyzeState;
    private ParameterExpression? _parameterExpression;

    public FunctionNode(Token name,
        IReadOnlyCollection<FunctionParameterNode> parameters,
        ITypeNode? returnTypeNode,
        IReadOnlyCollection<IStatementNode> statements)
    {
        Name = name;
        Parameters = parameters;
        ReturnTypeNode = returnTypeNode;
        Statements = statements;
        Children = parameters.Concat<INode>(returnTypeNode != null ? new[] { returnTypeNode } : Array.Empty<INode>()).Concat(statements).ToArray();
    }

    public ITypeNode? ReturnTypeNode { get; }

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

        ReturnTypeNode?.SetupScopes(scope);

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

        ReturnTypeNode?.Resolve(new ResolveContext(null));

        foreach (var statement in Statements.OrderBy(x => x is FunctionNode ? 0 : 1)) {
            statement.Resolve(new ResolveContext(null));
        }

        if (_analyzeState != AnalyzeState.Analyzing) {
            // Analyzed already done in a circular analyze
            return;
        }

        _analyzeState = AnalyzeState.Analyzed;

        var actualReturnType = BodyUtils.CalculateReturnType(Statements);
        TybscriType returnType;
        if (ReturnTypeNode != null) {
            returnType = ReturnTypeNode.Type;
            if (!returnType.IsAssignableFrom(actualReturnType)) {
                throw new TybscriException($"Return type '{actualReturnType}' is not compatible with the declared return type '{returnType}'");
            }
        } else {
            returnType = actualReturnType;
        }
        SymbolType = new FuncType(returnType,
            Parameters.Select(p => new FuncParameter(p.Name.Text, p.SymbolType)).ToList, BodyUtils.IsAsync(Statements));
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

        var body = BodyUtils.GenerateLinqExpression(Statements, funcType.ReturnType.ClrType, funcType.Async);
        var parameters = Parameters.Select(x => x.SymbolLinqExpression);
        var lambda = ExpressionUtils.CreateLambda(funcType, body, parameters);
        return Expression.Assign(_parameterExpression, lambda);
    }

    public ValueTask<object?> EvaluateAsync(EvalContext context)
    {
        if (SymbolType is not FuncType funcType) {
            throw new InvalidOperationException("Cannot evaluate function without type");
        }

        // Create parameter symbols for binding
        var parameterSymbols = Parameters
            .Select(p => new SourceSymbol(p.SymbolName, p) as ISymbol)
            .ToList();

        // Create a delegate that captures the current context and evaluates the body
        Func<object?[], ValueTask<object?>> evaluator = async (args) =>
        {
            var funcContext = context.CreateChildScopeWithLocals();

            // Bind parameters to arguments
            for (int i = 0; i < parameterSymbols.Count && i < args.Length; i++) {
                funcContext.Locals[parameterSymbols[i]] = args[i];
            }

            // Evaluate the body
            try {
                object? result = null;
                foreach (var statement in Statements.OrderBy(x => x is FunctionNode ? 0 : 1)) {
                    result = await ((IAsyncEvaluatable)statement).EvaluateAsync(funcContext);
                }
                return result;
            }
            catch (ReturnException returnEx) {
                return returnEx.Value;
            }
        };

        // Wrap in appropriate delegate type
        Delegate funcDelegate = funcType.Parameters.Count switch
        {
            0 => new Func<object?>(() => evaluator(Array.Empty<object?>()).AsTask().Result),
            1 => new Func<object?, object?>(a => evaluator(new[] { a }).AsTask().Result),
            2 => new Func<object?, object?, object?>((a, b) => evaluator(new[] { a, b }).AsTask().Result),
            3 => new Func<object?, object?, object?, object?>((a, b, c) => evaluator(new[] { a, b, c }).AsTask().Result),
            _ => throw new NotSupportedException($"Functions with {funcType.Parameters.Count} parameters not supported in interpreter")
        };

        // Register the function in the context
        var symbol = Scope.ResolveLast(SymbolName);
        if (symbol != null) {
            context.Locals[symbol] = funcDelegate;
        }

        return ValueTask.FromResult<object?>(null);
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