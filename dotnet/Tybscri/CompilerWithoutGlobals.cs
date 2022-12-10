using Tybscri.Common;
using Tybscri.Symbols;

namespace Tybscri;

public class Compiler
{
    public static Compiler<TGlobals> Create<TGlobals>()
    {
        return new Compiler<TGlobals>(Environment.Create(typeof(TGlobals)));
    }

    public static Compiler Default { get; } = new Compiler(Environment.Standard);

    private readonly Compiler<object> _compiler;

    public Compiler(Environment symbols)
    {
        _compiler = new Compiler<object>(symbols);
    }

    public Environment Environment => _compiler.Environment;

    public Action CompileScript(string script)
    {
        var compile = _compiler.CompileScript(script);
        return () => compile(null!);
    }

    public Func<TResult> CompileScript<TResult>(string script)
    {
        var compile = _compiler.CompileScript<TResult>(script);
        return () => compile(null!);
    }

    public Func<TResult> CompileExpression<TResult>(string expression)
    {
        var compile = _compiler.CompileExpression<TResult>(expression);
        return () => compile(null!);
    }

    public void EvaluateScript(string script)
    {
        _compiler.EvaluateScript(script, null!);
    }

    public T EvaluateScript<T>(string script)
    {
        return _compiler.EvaluateScript<T>(script, null!);
    }

    public T EvaluateExpression<T>(string expression)
    {
        var compiled = CompileExpression<T>(expression);
        return compiled();
    }

    public T EvaluateExpression<T>(string expression, TybscriType expectedType)
    {
        return _compiler.EvaluateExpression<T>(expression, null!, expectedType);
    }

    public TybscriType EvaluateType(string typeString)
    {
        var parser = new TybscriParser(typeString);
        var typeNode = parser.ParseType();
        if (!parser.EndOfScript) {
            throw new TybscriException("Could not parse full text as a type");
        }

        var scope = new Scope(Environment.Symbols.Select(x => new ExternalSymbol(x.Expression, x.Type, x.Name)));
        typeNode.SetupScopes(scope);
        typeNode.Resolve(new ResolveContext(null));
        return typeNode.Type;
    }
}