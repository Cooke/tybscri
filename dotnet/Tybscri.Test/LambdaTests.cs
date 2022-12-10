using System;
using System.Collections.Generic;
using Xunit;

namespace Tybscri.Test;

public class LambdaTests
{
    private readonly Compiler _compiler;

    public LambdaTests()
    {
        _compiler = Compiler.Default;
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
    
    [Fact]
    public void Variable()
    {
        var func = _compiler.EvaluateExpression<Func<double>>(
            @"{ 
                var value = 123
                value 
            }");
        Assert.Equal(123, func());
    }
    
    [Fact]
    public void Return()
    {
        var func = _compiler.EvaluateExpression<Func<double>>(
            @"{ 
                return 123
            }");
        Assert.Equal(123, func());
    }
    
    [Fact]
    public void Function()
    {
        var func = _compiler.EvaluateExpression<Func<double>>(
            @"{ 
                fun foo() {
                    123
                }
                
                foo()
            }");
        Assert.Equal(123, func());
    }
}