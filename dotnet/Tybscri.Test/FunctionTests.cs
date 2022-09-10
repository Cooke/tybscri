using System;
using System.Collections.Generic;
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
    public void ImplicitReturn()
    {
        var output = _compiler.EvaluateScript<double>(@"
            fun foo() {
                123
            }

            foo()
            ");
        Assert.Equal(123, output);
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
    public void OneParameter()
    {
        var output = _compiler.EvaluateScript<double>(@"
            fun identity(value: number) {
                value
            }

            identity(123)
            ");
        Assert.Equal(123, output);
    }

    [Fact]
    public void TwoParameters()
    {
        var output = _compiler.EvaluateScript<double>(@"
            fun sub(val1: number, val2: number) {
                val1 - val2
            }

            sub(3, 1)
            ");
        Assert.Equal(2, output);
    }

    [Fact]
    public void ThreeParameters()
    {
        var output = _compiler.EvaluateScript<List<object>>(@"
            fun list3(val1: number, val2: ""one"", val3: true) {
                [val1, val2, val3]
            }

            list3(1, ""one"", true)
            ");
        Assert.Collection(output, x => Assert.Equal(1, x), x => Assert.Equal("one", x), x => Assert.Equal(true, x));
    }

    [Fact]
    public void SeveralReturns()
    {
        var output = _compiler.EvaluateScript<List<double>>(@"
            fun foo(val: number) {
                if (val < 10) {
                    return 1
                }

                if (val < 100) {
                    return 2
                }

                return 3
            }

            [foo(1), foo(10), foo(100)]
            ");
        Assert.Collection(output, x => Assert.Equal(1, x), x => Assert.Equal(2, x), x => Assert.Equal(3, x));
    }

    [Fact]
    public void TrailingLambda()
    {
        var env = new TestEnvironment();
        _compiler.EvaluateScript(@"
            eval { true }
            ", env);
        Assert.True(env.DidEval);
    }

    private class TestEnvironment
    {
        public bool DidEval;

        // ReSharper disable once UnusedMember.Local
        public void Eval(Func<bool> func)
        {
            DidEval = true;
            func();
        }
    }
}