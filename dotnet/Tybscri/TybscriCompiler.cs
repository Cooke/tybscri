using System.Linq.Expressions;
using System.Reflection;
using Antlr4.Runtime;
using Tybscri.TypeMapping;

namespace Tybscri;

public class TybscriCompiler
{
    private readonly TypeMapper _typeMapper = new TypeMapper();

    public TybscriCompiler()
    {
        _typeMapper.Add(typeof(int), StandardTypes.Number);
        _typeMapper.Add(typeof(double), StandardTypes.Number);
        _typeMapper.Add(typeof(bool), StandardTypes.Boolean);
        _typeMapper.Add(typeof(string), StandardTypes.String);
    }

    public Func<TEnvironment, TResult> CompileExpression<TEnvironment, TResult>(string expression,
        TybscriType? expectedResultType = null) where TEnvironment : class
    {
        var parser = new TybscriParser(expression);
        var expressionNode = parser.ParseExpression();

        var envExpression = Expression.Parameter(typeof(TEnvironment), "environment");
        var scope = new Scope(GetEnvironmentSymbols<TEnvironment>(envExpression));
        expressionNode.SetupScopes(scope);
        expressionNode.ResolveTypes(new AnalyzeContext(expectedResultType));

        var clrExpression = expressionNode.ToClrExpression(new GenerateContext(Expression.Label()));
        var lambda = Expression.Lambda<Func<TEnvironment, TResult>>(clrExpression, envExpression);
        return lambda.Compile();
    }

    public Func<TResult> CompileExpression<TResult>(string script)
    {
        var compile = CompileExpression<StandardContext, TResult>(script);
        return () => compile(StandardContext.Instance);
    }

    public TResult EvaluateExpression<TResult>(string script)
    {
        var func = CompileExpression<TResult>(script);
        return func();
    }

    public TResult EvaluateExpression<TEnvironment, TResult>(string script, TEnvironment context)
        where TEnvironment : class
    {
        var func = CompileExpression<TEnvironment, TResult>(script);
        return func(context);
    }

    public Func<TEnvironment, TResult> CompileScript<TEnvironment, TResult>(string script) where TEnvironment : class
    {
        var parser = new TybscriParser(script);
        var scriptNode = parser.ParseScript();
        scriptNode.SetupScopes(new Scope());
        scriptNode.ResolveTypes(new AnalyzeContext(_typeMapper.Map(typeof(TResult))));
        var clrExpression = scriptNode.ToClrExpression(new GenerateContext(Expression.Label()));
        var lambda = Expression.Lambda<Func<TResult>>(clrExpression);
        var compileScript = lambda.Compile();
        return _ => compileScript();
    }

    public Func<TResult> CompileScript<TResult>(string script)
    {
        var compile = CompileScript<StandardContext, TResult>(script);
        return () => compile(StandardContext.Instance);
    }

    public TResult EvaluateScript<TResult>(string script)
    {
        var func = CompileScript<TResult>(script);
        return func();
    }

    public TResult EvaluateScript<TEnvironment, TResult>(string script, TEnvironment context) where TEnvironment : class
    {
        var func = CompileScript<TEnvironment, TResult>(script);
        return func(context);
    }

    private IEnumerable<ExternalSymbol> GetEnvironmentSymbols<TEnvironment>(ParameterExpression envExpression)
        where TEnvironment : class
    {
        foreach (var prop in typeof(TEnvironment).GetProperties(BindingFlags.Instance | BindingFlags.Public)) {
            var getter = Expression.Property(envExpression, prop);
            yield return new ExternalSymbol(getter, _typeMapper.Map(prop.PropertyType), prop.Name);
        }
    }
}