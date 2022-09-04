using System;
using Xunit;

namespace Tybscri.Test;

public class FunctionTests
{
    private readonly TybscriCompiler _compiler;

    public FunctionTests()
    {
        _compiler = new TybscriCompiler();
    }

    [Fact]
    public void Invoke()
    {
        var output = _compiler.EvaluateScript<string>(@"
            fun hello() {
                ""hello""
            }
            hello()
            ");
        Assert.Equal("hello", output);
    }

    [Fact]
    public void Nesting()
    {
        var output = _compiler.EvaluateScript<string>(@"
            fun foo() {
                fun bar() {
                    ""hello""
                }

                bar()
            }

            foo()
            ");
        Assert.Equal("hello", output);
    }


    [Fact]
    public void Hoisting()
    {
        var output = _compiler.EvaluateScript<string>(@"
            fun foo() {
                bar()
            }

            fun bar() {
                ""hello""
            }

            foo()
            ");
        Assert.Equal("hello", output);
    }

    [Fact]
    public void Return()
    {
        var output = _compiler.EvaluateScript<double>(@"
            fun foo() {
                return 123
            }

            foo()
            ");
        Assert.Equal(123, output);
    }

    [Fact]
    public void TrailingLambda()
    {
        var env = new TestEnvironment();
        _compiler.EvaluateScript(@"
            eval { true }
            ", env);
        Assert.True(env.didEval);
    }

    private class TestEnvironment
    {
        public bool didEval;

        public void eval(Func<bool> func)
        {
            didEval = true;
            func();
        }
    }
}