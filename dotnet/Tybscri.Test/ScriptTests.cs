using System;
using System.Collections.Generic;
using Xunit;

namespace Tybscri.Test;

public class ScriptTests
{
    private readonly Compiler _compiler;

    public ScriptTests()
    {
        _compiler = Compiler.Default;
    }

    [Fact]
    public void Function()
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
    public void HoistingFunction()
    {
        var output = _compiler.EvaluateScript<string>(@"
            foo()

            fun foo() {
                ""hello""
            }
            ");
        Assert.Equal("hello", output);
    }

    [Fact]
    public void Return()
    {
        var output = _compiler.EvaluateScript<double>(@"
            return 123
            ");
        Assert.Equal(123, output);
    }

    [Fact]
    public void SeveralReturns()
    {
        var output = _compiler.EvaluateScript<double>(@"
            if (1 < 10) {
                return 1
            }

            if (1 < 100) {
                return 2
            }

            return 3
            ");
        Assert.Equal(1, output);
    }
}