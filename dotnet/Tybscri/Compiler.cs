using System.Linq.Expressions;
using DotNext.Metaprogramming;
using Tybscri.Common;
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
}