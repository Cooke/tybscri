using System.Linq.Expressions;
using Antlr4.Runtime;

namespace Tybscri;

public class TybscriCompiler
{
    public Func<TContext, TResult> CompileExpression<TContext, TResult>(string expression,
        TybscriType? expectedResultType = null) where TContext : class
    {
        var parser = new TybscriParser(expression);
        var scriptNode = parser.ParseExpression();
        scriptNode.SetupScopes(new Scope());
        scriptNode.ResolveTypes(new CompileContext(), expectedResultType);
        var clrExpression = scriptNode.ToClrExpression();
        var lambda = Expression.Lambda<Func<TResult>>(clrExpression);
        var func = lambda.Compile();
        return _ => func();
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

    public TResult EvaluateExpression<TContext, TResult>(string script, TContext context) where TContext : class
    {
        var func = CompileExpression<TContext, TResult>(script);
        return func(context);
    }

    public Func<TContext, TResult> CompileScript<TContext, TResult>(string script) where TContext : class
    {
        var parser = new TybscriParser(script);
        var scriptNode = parser.ParseScript();
        scriptNode.SetupScopes(new Scope());
        scriptNode.ResolveTypes(new CompileContext());
        var clrExpression = scriptNode.ToClrExpression<TResult>();
        var compileScript = clrExpression.Compile();
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

    public TResult EvaluateScript<TContext, TResult>(string script, TContext context) where TContext : class
    {
        var func = CompileScript<TContext, TResult>(script);
        return func(context);
    }
}