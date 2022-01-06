using Antlr4.Runtime;

namespace Tybscri;

public class TybscriCompiler
{
    public Func<TContext, TResult> Compile<TContext, TResult>(string script) where TContext : class
    {
        var parser = new TybscriParser(script);
        var scriptNode = parser.ParseScript();
        scriptNode.Analyze(new AnalyzeContext(new Scope(), null));
        var clrExpression = scriptNode.ToClrExpression<TContext, TResult>();
        return clrExpression.Compile();
    }

    public Func<TResult> Compile<TResult>(string script)
    {
        var compile = Compile<StandardContext, TResult>(script);
        return () => compile(StandardContext.Instance);
    }
}