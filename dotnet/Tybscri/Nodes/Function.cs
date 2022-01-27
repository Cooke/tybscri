using System.Linq.Expressions;

namespace Tybscri.Nodes;

enum AnalyzeState
{
    NotAnalyzed,
    Analyzing,
    Analyzed
}

public class Function : Node, ISymbolNode
{
    public ParameterExpression LinqExpression => _parameterExpression ?? throw new InvalidOperationException();

    public Token Name { get; }
    public IReadOnlyCollection<ParameterNode> Parameters { get; }
    public Block Body { get; }
    
    private AnalyzeState _analyzeState;
    private ParameterExpression? _parameterExpression;

    public Function(Token name, IReadOnlyCollection<ParameterNode> parameters, Block body) : base(parameters
        .Cast<Node>().Concat(new[] { body }).ToArray())
    {
        Name = name;
        Parameters = parameters;
        Body = body;
    }

    public override Scope SetupScopes(Scope scope)
    {
        foreach (var par in Parameters) {
            par.SetupScopes(scope);
        }

        Body.SetupScopes(scope.CreateChildScope(Parameters.Select(x => new SourceSymbol(x.Name.Text, x))));
        Scope = scope;
        return scope;
    }

    public override void ResolveTypes(CompileContext context, TybscriType? expectedType)
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

        Body.ResolveTypes(context, null);

        if (_analyzeState != AnalyzeState.Analyzing) {
            // Analyzed already done in a circular analyze
            return;
        }

        // var allReturns = this.FindReturns(Body);
        // const unionType: UnionType = {
        //   kind: "Union",
        //   types: allReturns
        //     .map((x) => x.expression?.valueType ?? nullType)
        //     .concat([this.body.valueType]),
        // };
        //
        // const returnType = reduceUnionType(unionType);
        var returnType = StandardTypes.String;

        _analyzeState = AnalyzeState.Analyzed;
        ValueType = new FuncType(returnType, Parameters.Select(p => new FuncParameter(p.Name.Text, p.Type.Type)));
        _parameterExpression = Expression.Parameter(ValueType.ClrType, Name.Text);
    }

    public override Expression ToClrExpression()
    {
        var lambdaExpression = Expression.Lambda(Body.ToClrExpression(),
            (IEnumerable<ParameterExpression>?)Parameters.Select(x => x.LinqExpression));
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
        ResolveTypes(context, null);
    }
}

public class ParameterNode : Node, ISymbolNode
{
    private ParameterExpression? _linqExpression;

    public Token Name { get; }

    public TypeNode Type { get; }

    public ParameterNode(Token name, TypeNode type) : base(type)
    {
        Name = name;
        Type = type;
    }

    public override void ResolveTypes(CompileContext context, TybscriType? expectedType = null)
    {
        Type.ResolveTypes(context, expectedType);
        _linqExpression = Expression.Parameter(Type.Type.ClrType, Name.Text);
    }

    public override Expression ToClrExpression()
    {
        return _linqExpression ?? throw new InvalidOperationException();
    }

    public ParameterExpression LinqExpression => _linqExpression ?? throw new InvalidOperationException();
    
    public void ResolveTypes(CompileContext context)
    {
        ResolveTypes(context, null);
    }
}