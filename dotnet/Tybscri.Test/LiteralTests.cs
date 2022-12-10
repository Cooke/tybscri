using System;
using System.Collections.Generic;
using Xunit;

namespace Tybscri.Test;

public class LiteralTests
{
    private readonly Compiler _compiler;

    public LiteralTests()
    {
        _compiler = Compiler.Default;
    }

    [Fact]
    public void True()
    {
        Assert.True(_compiler.EvaluateExpression<bool>("true"));
    }

    [Fact]
    public void False()
    {
        Assert.False(_compiler.EvaluateExpression<bool>("false"));
    }

    [Fact]
    public void Null()
    {
        Assert.Null(_compiler.EvaluateExpression<object?>("null"));
    }

    [Fact]
    public void String()
    {
        Assert.Equal("hello", _compiler.EvaluateExpression<string>("\"hello\""));
    }

    [Fact]
    public void Number()
    {
        Assert.Equal(123, _compiler.EvaluateExpression<double>("123"));
    }

    [Fact]
    public void List()
    {
        Assert.Collection(_compiler.EvaluateExpression<List<double>>("[1]"), v => Assert.Equal(1, v));
    }

    [Fact]
    public void ListOfUnion()
    {
        Assert.Collection(_compiler.EvaluateExpression<List<object>>("[1, \"hi\"]"), v => Assert.Equal(1d, v),
            v => Assert.Equal("hi", v));
    }

    [Fact]
    public void Lambda()
    {
        var getOne = _compiler.EvaluateExpression<Func<double>>("{ 1 }");
        Assert.Equal(1f, getOne());
    }
}