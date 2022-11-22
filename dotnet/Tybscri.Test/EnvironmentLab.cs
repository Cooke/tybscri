using System;
using System.Collections.Generic;
using System.Reflection;

namespace Tybscri.Test;

public class EnvironmentLab
{
    public void Test()
    {
        var env = ScriptEngine.CreateEnvironment<List<int>>();
        var compiler = ScriptEngine.Create(env);
        compiler.Compile("");
            
        var env2 = new Environment();
        var compiler2 = ScriptEngine.Create(env2);
        compiler2.Compile("")();
    }

    public record Environment;

    public record Environment<T> : Environment;

    public interface EnvironmentBuilder
    {
        TybscriType Add(Type clrType);

        Environment Build();
    }

    public static class ScriptEngine
    {
        public static Environment<T> CreateEnvironment<T>()
        {
            throw new NotImplementedException();
        }

        public static Compiler<TEnvironment> Create<TEnvironment>(Environment<TEnvironment> environment)
        {
            throw new NotImplementedException();
        }

        public static Compiler<object> Create(Environment environment)
        {
            throw new NotImplementedException();
        }

        public static Compiler Default { get; }
    }

    public class Compiler<TEnvironment>
    {
        private readonly Environment<TEnvironment> _environment;


        public Compiler(Environment<TEnvironment> environment)
        {
            _environment = environment;
        }

        public Action<TEnvironment> Compile(string script)
        {
            throw new InvalidOperationException();
        }

        public Func<TEnvironment, TResult> Compile<TResult>(string script)
        {
            throw new InvalidOperationException();
        }

        public Func<TEnvironment, TResult> CompileExpression<TResult>(string expression)
        {
            throw new InvalidOperationException();
        }
    }

    public class Compiler
    {
        private readonly Compiler<object> _compiler;

        public Compiler(Environment environment)
        {
        }

        public Compiler(Compiler<object> compiler)
        {
            _compiler = compiler;
        }

        public Action Compile(string script)
        {
            var compile = _compiler.Compile(script);
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