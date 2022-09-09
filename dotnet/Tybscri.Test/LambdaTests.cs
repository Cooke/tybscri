using System;
using System.Collections.Generic;
using Xunit;

namespace Tybscri.Test;

public class LambdaTests
{
    private readonly TybscriCompiler _compiler;

    public LambdaTests()
    {
        _compiler = new TybscriCompiler();
    }

    [Fact]
    public void ItParameter()
    {
        var identity = _compiler.EvaluateExpression<Func<double, double>>("{ it }");
        Assert.Equal(2, identity(2));
    }

    [Fact]
    public void OneParameter()
    {
        var identity = _compiler.EvaluateExpression<Func<double, double>>("{ number => number }");
        Assert.Equal(2, identity(2));
    }

    [Fact]
    public void TwoParameters()
    {
        var sub = _compiler.EvaluateExpression<Func<double, double, double>>("{ arg1, arg2 => arg1 - arg2 }");
        Assert.Equal(9, sub(10, 1));
    }
    
    [Fact]
    public void ThreeParameters()
    {
        var math = _compiler.EvaluateExpression<Func<double, double, double, double>>("{ arg1, arg2, arg3 => arg1 - arg2 - arg3}");
        Assert.Equal(8, math(10, 1, 1));
    }
}