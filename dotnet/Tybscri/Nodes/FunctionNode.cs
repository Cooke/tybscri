using System.Linq.Expressions;

namespace Tybscri.Nodes;

enum AnalyzeState
{
    NotAnalyzed,
    Analyzing,
    Analyzed
}

public class FunctionNode : Node, ISymbolDefinitionNode
{
    public ParameterExpression LinqExpression => _parameterExpression ?? throw new InvalidOperationException();

    public Token Name { get; }
    public IReadOnlyCollection<ParameterNode> Parameters { get; }
    public BlockNode Body { get; }

    private AnalyzeState _analyzeState;
    private ParameterExpression? _parameterExpression;

    public FunctionNode(Token name, IReadOnlyCollection<ParameterNode> parameters, BlockNode body) : base(parameters
        .Cast<Node>().Concat(new[] { body }).ToArray())
    {
        Name = name;
        Parameters = parameters;
        Body = body;
    }

    public override void SetupScopes(ScopeContext scopeContext)
    {
        foreach (var par in Parameters) {
            par.SetupScopes(scopeContext);
        }

        Body.SetupScopes(new ScopeContext(
            scopeContext.Scope.CreateChildScope(Parameters.Select(x => new SourceSymbol(x.Name.Text, x)))));
        Scope = scopeContext.Scope;
    }

    public override void ResolveTypes(AnalyzeContext context)
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

            ValueType = new FuncType(StandardTypes.Unknown,
                Parameters.Select((x) => new FuncParameter(x.Name.Text, x.Type.Type)));
            return;
        }

        _analyzeState = AnalyzeState.Analyzing;
        foreach (var par in Parameters) {
            par.ResolveTypes(context);
        }

        Body.ResolveTypes(new AnalyzeContext(null));

        if (_analyzeState != AnalyzeState.Analyzing) {
            // Analyzed already done in a circular analyze
            return;
        }

        var allReturns = FindReturns(Body).Concat(new[] { Body.ValueType });
        var returnType = UnionType.Create(allReturns.ToArray());

        _analyzeState = AnalyzeState.Analyzed;
        ValueType = new FuncType(returnType, Parameters.Select(p => new FuncParameter(p.Name.Text, p.Type.Type)));
        _parameterExpression = Expression.Parameter(ValueType.ClrType, Name.Text);
    }

    private IEnumerable<TybscriType> FindReturns(Node node)
    {
        if (node is FunctionNode) {
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

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        if (_parameterExpression == null) {
            throw new InvalidOperationException("Invalid function state");
        }

        if (ValueType is not FuncType funcType) {
            throw new InvalidOperationException("Cannot compile function");
        }

        var clrReturnType = funcType.ReturnType.ClrType;
        var returnLabel = Expression.Label(clrReturnType, "LastFuncStatement");
        var innerGenerateContext = generateContext with { ReturnLabel = returnLabel };
        Expression funcBlock = Body.ValueType == NeverType.Instance
            ? Expression.Block(Body.ToClrExpression(innerGenerateContext),
                Expression.Label(returnLabel,
                    Expression.Throw(Expression.New(typeof(InvalidOperationException)), clrReturnType)))
            : Expression.Label(returnLabel, Body.ToClrExpression(innerGenerateContext));
        var lambdaExpression = Expression.Lambda(funcBlock, Parameters.Select(x => x.LinqExpression));
        return Expression.Assign(_parameterExpression, lambdaExpression);
    }
    //
    // private findReturns(node: Node): ReturnNode[] {
    //   if (node instanceof FunctionNode || node instanceof LambdaLiteralNode) {
    //     return [];
    //   }
    //
    //   if (node instanceof ReturnNode) {
    //     return [node];
    //   }
    //
    //   const returns: ReturnNode[] = [];
    //   for (const child of node.children) {
    //     returns.push(...this.findReturns(child));
    //   }
    //
    //   return returns;
    // }

    public void ResolveTypes(CompileContext context)
    {
        ResolveTypes(new AnalyzeContext(null));
    }
}

public class ParameterNode : Node, ISymbolDefinitionNode
{
    private ParameterExpression? _linqExpression;

    public Token Name { get; }

    public TypeNode Type { get; }

    public ParameterNode(Token name, TypeNode type) : base(type)
    {
        Name = name;
        Type = type;
    }

    public override void SetupScopes(ScopeContext scopeContext)
    {
        Scope = scopeContext.Scope;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        Type.ResolveTypes(context);
        _linqExpression = Expression.Parameter(Type.Type.ClrType, Name.Text);
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        return _linqExpression ?? throw new InvalidOperationException();
    }

    public ParameterExpression LinqExpression => _linqExpression ?? throw new InvalidOperationException();
}