using System;
using Xunit;

namespace Tybscri.Test;

public class OperatorTests
{
    private readonly TybscriCompiler _compiler;

    public OperatorTests()
    {
        _compiler = new TybscriCompiler();
    }

    [Fact]
    public void LessThan()
    {
        Assert.True(_compiler.EvaluateExpression<bool>("0 < 1"));
        Assert.False(_compiler.EvaluateExpression<bool>("1 < 0"));
    }

    [Fact]
    public void GreaterThan()
    {
        Assert.True(_compiler.EvaluateExpression<bool>("1 > 0"));
        Assert.False(_compiler.EvaluateExpression<bool>("0 > 1"));
    }
    
    [Fact]
    public void Subtract()
    {
        Assert.Equal(9, _compiler.EvaluateExpression<double>("10 - 1"));
        Assert.Equal(6, _compiler.EvaluateExpression<double>("10 - 1 - 3"));
    }
    
    [Fact]
    public void Add()
    {
        Assert.Equal(11, _compiler.EvaluateExpression<double>("10 + 1"));
        Assert.Equal(14, _compiler.EvaluateExpression<double>("10 + 1 + 3"));
    }
    
    [Fact]
    public void Multiply()
    {
        Assert.Equal(30, _compiler.EvaluateExpression<double>("5 * 6"));
        Assert.Equal(300, _compiler.EvaluateExpression<double>("5 * 6 * 10"));
    }
    
    [Fact]
    public void Divide()
    {
        Assert.Equal(3, _compiler.EvaluateExpression<double>("9 / 3"));
        Assert.Equal(1.5, _compiler.EvaluateExpression<double>("9 / 3 / 2"));
    }
    
    [Fact]
    public void Modulo()
    {
        Assert.Equal(1, _compiler.EvaluateExpression<double>("9 % 2"));
        Assert.Equal(0, _compiler.EvaluateExpression<double>("9 % 10 % 3"));
    }

    [Fact]
    public void And()
    {
        Assert.True(_compiler.EvaluateExpression<bool>("true && true"));
        Assert.False(_compiler.EvaluateExpression<bool>("true && false"));
        Assert.False(_compiler.EvaluateExpression<bool>("false && true"));
        Assert.False(_compiler.EvaluateExpression<bool>("false && false"));
    }

    [Fact]
    public void AndLazy()
    {
        var env = new TestEnv();
        _compiler.EvaluateExpression<bool, TestEnv>("false && getTrue()", env);
        Assert.False(env.Called);
        _compiler.EvaluateExpression<bool, TestEnv>("true && getTrue()", env);
        Assert.True(env.Called);
    }

    [Fact]
    public void Or()
    {
        Assert.True(_compiler.EvaluateExpression<bool>("true || true"));
        Assert.True(_compiler.EvaluateExpression<bool>("true || false"));
        Assert.True(_compiler.EvaluateExpression<bool>("false || true"));
        Assert.False(_compiler.EvaluateExpression<bool>("false || false"));
    }
    
    [Fact]
    public void OrShortCircuit()
    {
        var env = new TestEnv();
        _compiler.EvaluateExpression<bool, TestEnv>("true || getTrue()", env);
        Assert.False(env.Called);
        _compiler.EvaluateExpression<bool, TestEnv>("false || getTrue()", env);
        Assert.True(env.Called);
    }

    private class TestEnv
    {
        public bool GetTrue()
        {
            Called = true;
            return true;
        }

        public bool Called { get; set; }
    }
}