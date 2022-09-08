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
        var moreThanOne = _compiler.EvaluateExpression<Func<double, bool>>("{ it > 1 }");
        Assert.True(moreThanOne(2));
        Assert.False(moreThanOne(1));
    }
    
    [Fact]
    public void OneParameter()
    {
        var moreThanOne = _compiler.EvaluateExpression<Func<double, bool>>("{ number => number > 1 }");
        Assert.True(moreThanOne(2));
        Assert.False(moreThanOne(1));
    }
}