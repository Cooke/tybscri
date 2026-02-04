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

    [Fact]
    public void StringWithUnicode()
    {
        Assert.Equal("Hello 世界 🌍", _compiler.EvaluateExpression<string>("\"Hello 世界 🌍\""));
    }

    [Fact]
    public void StringWithVariousUnicodeScripts()
    {
        Assert.Equal("日本語 한국어 العربية", _compiler.EvaluateExpression<string>("\"日本語 한국어 العربية\""));
    }

    [Fact]
    public void ScriptWithUnicodeComments()
    {
        // Line comments with unicode should be ignored
        var result = _compiler.EvaluateScript<double>("""
            // 日本語コメント
            var x = 42
            /* 中文注释 🎉 */
            x
            """);
        Assert.Equal(42, result);
    }
}