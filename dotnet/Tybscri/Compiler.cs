using System.Linq.Expressions;
using System.Reflection;
using DotNext.Metaprogramming;
using Tybscri.Common;
using Tybscri.Interpreter;
using Tybscri.Nodes;
using Tybscri.Symbols;

namespace Tybscri;

public class Compiler<TGlobals>
{
    public Compiler(Environment environment)
    {
        this.Environment = environment;
    }

    public Environment Environment { get; }

    public Action<TGlobals> CompileScript(string script)
    {
        var generateContext = new GenerateContext(x => x, false);
        var clrExpression = CreateScriptBodyExpression(script, null, generateContext);
        return Expression.Lambda<Action<TGlobals>>(clrExpression, Environment.GlobalsExpression).Compile();
    }

    public Func<TGlobals, TResult> CompileScript<TResult>(string script)
    {
        return CompileScript<TResult>(script, Environment.TypeMappings.Map(typeof(TResult)));
    }

    public Func<TGlobals, TResult> CompileScript<TResult>(string script, TybscriType expectedType)
    {
        var generateContext = new GenerateContext(x => x, false);
        var clrExpression = CreateScriptBodyExpression(script, expectedType, generateContext);
        return Expression.Lambda<Func<TGlobals, TResult>>(clrExpression, Environment.GlobalsExpression).Compile();
    }

    public Func<TGlobals, Task> CompileAsyncScript(string script)
    {
        var asyncLambda = CodeGenerator.AsyncLambda<Func<TGlobals, Task>>(context =>
        {
            var generateContext = new GenerateContext(ExpressionUtils.CreateAsyncResult, true);
            var clrExpression = CreateScriptBodyExpression(script, StandardTypes.Void, generateContext);
            CodeGenerator.Statement(Expression.Block(new[] { Environment.GlobalsExpression },
                Expression.Assign(Environment.GlobalsExpression, context[0]), clrExpression));
        });
        return asyncLambda.Compile();
    }

    public Func<TGlobals, Task<TResult>> CompileAsyncScript<TResult>(string script)
    {
        return CompileAsyncScript<TResult>(script, Environment.TypeMappings.Map(typeof(TResult)));
    }

    public Func<TGlobals, Task<TResult>> CompileAsyncScript<TResult>(string script, TybscriType expectedType)
    {
        var asyncLambda = CodeGenerator.AsyncLambda<Func<TGlobals, Task<TResult>>>(context =>
        {
            var generateContext = new GenerateContext(ExpressionUtils.CreateAsyncResult, true);
            var clrExpression = CreateScriptBodyExpression(script, expectedType, generateContext);
            CodeGenerator.Statement(Expression.Block(new[] { Environment.GlobalsExpression },
                Expression.Assign(Environment.GlobalsExpression, context[0]), clrExpression));
        });
        return asyncLambda.Compile();
    }

    public Func<TGlobals, TResult> CompileExpression<TResult>(string expression)
    {
        return CompileExpression<TResult>(expression, Environment.TypeMappings.Map(typeof(TResult)));
    }

    public Func<TGlobals, TResult> CompileExpression<TResult>(string expression, TybscriType expectedType)
    {
        var generateContext = new GenerateContext(x => x, false);
        var clrExpression = CreateExpressionBodyExpression(expression, expectedType, generateContext);
        return Expression.Lambda<Func<TGlobals, TResult>>(clrExpression, Environment.GlobalsExpression).Compile();
    }

    public Task<TResult> EvaluateScriptAsync<TResult>(string script, TGlobals globals)
    {
        var compiled = CompileAsyncScript<TResult>(script);
        return compiled(globals);
    }

    public Task EvaluateScriptAsync(string script, TGlobals globals)
    {
        var compiled = CompileAsyncScript(script);
        return compiled(globals);
    }

    public TybscriType EvaluateType(string type)
    {
        var parser = new TybscriParser(type);
        var typeNode = parser.ParseType();
        if (!parser.EndOfScript) {
            throw new TybscriException("Could not parse full text as a type");
        }

        var scope = new Scope(Environment.Symbols.Select(x => new ExternalSymbol(x.Expression, x.Type, x.Name)));
        typeNode.SetupScopes(scope);
        typeNode.Resolve(new ResolveContext(null));
        return typeNode.Type;
    }

    private Expression CreateScriptBodyExpression(string script,
        TybscriType? expectedType,
        GenerateContext generateContext)
    {
        var parser = new TybscriParser(script);
        var scriptNode = parser.ParseScript();
        var scope = new Scope(Environment.Symbols.Select(x => new ExternalSymbol(x.Expression, x.Type, x.Name)));
        scriptNode.SetupScopes(scope);
        scriptNode.Resolve(new ResolveContext(expectedType));
        return scriptNode.GenerateLinqExpression(generateContext);
    }

    private Expression CreateExpressionBodyExpression(string script,
        TybscriType expectedType,
        GenerateContext generateContext)
    {
        var parser = new TybscriParser(script);
        var scriptNode = parser.ParseExpression();
        var scope = new Scope(Environment.Symbols.Select(x => new ExternalSymbol(x.Expression, x.Type, x.Name)));
        scriptNode.SetupScopes(scope);
        scriptNode.Resolve(new ResolveContext(expectedType));
        return scriptNode.GenerateLinqExpression(generateContext);
    }

    public TResult EvaluateExpression<TResult>(string input, TGlobals globals)
    {
        var compiled = CompileExpression<TResult>(input);
        return compiled(globals);
    }

    public TResult EvaluateExpression<TResult>(string input, TGlobals globals, TybscriType expectedType)
    {
        var compiled = CompileExpression<TResult>(input, expectedType);
        return compiled(globals);
    }

    public void EvaluateScript(string script, TGlobals globals)
    {
        var compiled = CompileScript(script);
        compiled(globals);
    }

    public TResult EvaluateScript<TResult>(string script, TGlobals globals)
    {
        var compiled = CompileScript<TResult>(script);
        return compiled(globals);
    }

    /// <summary>
    /// Executes a script asynchronously using the specified execution mode.
    /// </summary>
    public Task<TResult> ExecuteScriptAsync<TResult>(string script, TGlobals globals,
        ExecutionMode mode = ExecutionMode.Compiled)
    {
        return mode switch
        {
            ExecutionMode.Compiled => EvaluateScriptAsync<TResult>(script, globals),
            ExecutionMode.Interpreted => InterpretScriptAsync<TResult>(script, globals),
            _ => throw new ArgumentOutOfRangeException(nameof(mode))
        };
    }

    /// <summary>
    /// Executes a script asynchronously using the specified execution mode.
    /// </summary>
    public Task ExecuteScriptAsync(string script, TGlobals globals,
        ExecutionMode mode = ExecutionMode.Compiled)
    {
        return mode switch
        {
            ExecutionMode.Compiled => EvaluateScriptAsync(script, globals),
            ExecutionMode.Interpreted => InterpretScriptAsync(script, globals),
            _ => throw new ArgumentOutOfRangeException(nameof(mode))
        };
    }

    /// <summary>
    /// Executes an expression asynchronously using the specified execution mode.
    /// </summary>
    public async Task<TResult> ExecuteExpressionAsync<TResult>(string expression, TGlobals globals,
        ExecutionMode mode = ExecutionMode.Compiled)
    {
        return mode switch
        {
            ExecutionMode.Compiled => EvaluateExpression<TResult>(expression, globals),
            ExecutionMode.Interpreted => await InterpretExpressionAsync<TResult>(expression, globals),
            _ => throw new ArgumentOutOfRangeException(nameof(mode))
        };
    }

    /// <summary>
    /// Interprets a script asynchronously using the tree-walking interpreter.
    /// This allows full async support including await in loops and conditionals.
    /// </summary>
    public async Task<TResult> InterpretScriptAsync<TResult>(string script, TGlobals globals)
    {
        var expectedType = Environment.TypeMappings.Map(typeof(TResult));
        var scriptNode = PrepareScriptForInterpretation(script, expectedType);
        var context = CreateEvalContext(globals);

        var result = await scriptNode.EvaluateAsync(context);
        return (TResult)result!;
    }

    /// <summary>
    /// Interprets a script asynchronously using the tree-walking interpreter.
    /// This allows full async support including await in loops and conditionals.
    /// </summary>
    public async Task InterpretScriptAsync(string script, TGlobals globals)
    {
        var scriptNode = PrepareScriptForInterpretation(script, StandardTypes.Void);
        var context = CreateEvalContext(globals);

        await scriptNode.EvaluateAsync(context);
    }

    /// <summary>
    /// Interprets an expression asynchronously using the tree-walking interpreter.
    /// </summary>
    public async Task<TResult> InterpretExpressionAsync<TResult>(string expression, TGlobals globals)
    {
        var expectedType = Environment.TypeMappings.Map(typeof(TResult));
        var parser = new TybscriParser(expression);
        var expressionNode = parser.ParseExpression();
        var scope = new Scope(Environment.Symbols.Select(x => new ExternalSymbol(x.Expression, x.Type, x.Name)));
        expressionNode.SetupScopes(scope);
        expressionNode.Resolve(new ResolveContext(expectedType));

        var context = CreateEvalContext(globals);
        var result = await ((IAsyncEvaluatable)expressionNode).EvaluateAsync(context);
        return (TResult)result!;
    }

    private ScriptNode PrepareScriptForInterpretation(string script, TybscriType? expectedType)
    {
        var parser = new TybscriParser(script);
        var scriptNode = parser.ParseScript();
        var scope = new Scope(Environment.Symbols.Select(x => new ExternalSymbol(x.Expression, x.Type, x.Name)));
        scriptNode.SetupScopes(scope);
        scriptNode.Resolve(new ResolveContext(expectedType));
        return scriptNode;
    }

    private EvalContext CreateEvalContext(TGlobals globals)
    {
        var context = new EvalContext { Globals = globals };

        // Initialize external symbols in context by name (for lookup by IdentifierNode)
        foreach (var symbol in Environment.Symbols) {
            var value = GetSymbolValue(symbol, globals);
            context.NamedValues[symbol.Name] = value;
        }

        return context;
    }

    private object? GetSymbolValue(EnvironmentSymbol symbol, TGlobals globals)
    {
        // Get the value from globals based on the symbol's expression
        if (globals == null) return null;

        var globalsType = typeof(TGlobals);

        // Try to find a matching member
        var member = globalsType.GetMember(symbol.Name,
            BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase)
            .FirstOrDefault();

        if (member == null) {
            // Try with PascalCase conversion (e.g., "wait" -> "Wait")
            var pascalName = char.ToUpperInvariant(symbol.Name[0]) + symbol.Name.Substring(1);
            member = globalsType.GetMember(pascalName, BindingFlags.Public | BindingFlags.Instance)
                .FirstOrDefault();
        }

        return member switch
        {
            FieldInfo fi => fi.GetValue(globals),
            PropertyInfo pi => pi.GetValue(globals),
            MethodInfo mi => CreateMethodDelegate(mi, globals),
            _ => null
        };
    }

    private Delegate? CreateMethodDelegate(MethodInfo methodInfo, TGlobals globals)
    {
        var parameters = methodInfo.GetParameters();

        // Create a delegate that invokes the method on globals
        return parameters.Length switch
        {
            0 => methodInfo.ReturnType == typeof(void)
                ? new Action(() => methodInfo.Invoke(globals, null))
                : new Func<object?>(() => methodInfo.Invoke(globals, null)),
            1 => new Func<object?, object?>(a => methodInfo.Invoke(globals, new[] { a })),
            2 => new Func<object?, object?, object?>((a, b) => methodInfo.Invoke(globals, new[] { a, b })),
            3 => new Func<object?, object?, object?, object?>((a, b, c) => methodInfo.Invoke(globals, new[] { a, b, c })),
            _ => null
        };
    }
}