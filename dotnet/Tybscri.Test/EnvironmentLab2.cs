using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Reflection;
using System.Threading.Tasks;

namespace Tybscri.Test2;

public class EnvironmentLab
{
    public void Test()
    {
        var env = Environment.Create<List<int>>();
        env.CompileScript("");
    }

    public record EnvironmentSymbols(IImmutableList<EnvironmentSymbol> All, TybscriType CollectionDefinition)
    {
    }

    public class Environment<TGlobals>
    {
        public Environment(EnvironmentSymbols symbols)
        {
            this.Symbols = symbols;
        }

        public EnvironmentSymbols Symbols { get; init; }

        public Action<TGlobals> CompileScript(string script)
        {
            throw new InvalidOperationException();
        }

        public Func<TGlobals, TResult> CompileScript<TResult>(string script)
        {
            throw new InvalidOperationException();
        }

        public Func<TGlobals, TResult> CompileScript<TResult>(string script, TybscriType expectedType)
        {
            throw new InvalidOperationException();
        }
        
        public Func<TGlobals, Task<TResult>> CompileAsyncScript<TResult>(string script)
        {
            throw new InvalidOperationException();
        }

        public Func<TGlobals, Task<TResult>> CompileAsyncScript<TResult>(string script, TybscriType expectedType)
        {
            throw new InvalidOperationException();
        }

        public Func<TGlobals, TResult> CompileExpression<TResult>(string expression)
        {
            throw new InvalidOperationException();
        }

        public Func<TGlobals, TResult> CompileExpression<TResult>(string expression, TybscriType expectedType)
        {
            throw new InvalidOperationException();
        }

        public Task<TResult> EvaluateScriptAsync<TResult>(string script, TGlobals globals)
        {
            var compiled = CompileAsyncScript<TResult>(script);
            return compiled(globals);
        }
    }

    public class Environment
    {
        public static Environment<TGlobals> Create<TGlobals>()
        {
            throw new NotImplementedException();
        }

        public static Environment Default { get; }

        private readonly Environment<object> _environment;

        public Environment(EnvironmentSymbols symbols)
        {
            _environment = new Environment<object>(symbols);
        }

        public EnvironmentSymbols Symbols => _environment.Symbols;

        public Action Compile(string script)
        {
            var compile = _environment.CompileScript(script);
            return () => compile(null!);
        }

        public Func<TResult> Compile<TResult>(string script)
        {
            throw new InvalidOperationException();
        }

        public Func<TResult> CompileExpression<TResult>(string expression)
        {
            throw new InvalidOperationException();
        }
    }
}