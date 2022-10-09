using System;
using System.Collections.Generic;
using Tybscri.Common;
using Xunit;

namespace Tybscri.Test;

public class TypeTests
{
    private readonly TybscriCompiler _compiler;

    public TypeTests()
    {
        _compiler = new TybscriCompiler();
    }

    [Fact]
    public void Number() => AssertType(StandardTypes.Number, "Number");

    [Fact]
    public void Boolean() => AssertType(StandardTypes.Boolean, "Boolean");

    [Fact]
    public void String() => AssertType(StandardTypes.String, "String");

    [Fact]
    public void Null() => AssertType(StandardTypes.Null, "Null");

    [Fact]
    public void NumberLiteral() => AssertType(LiteralType.FromClrType(123), "123");

    [Fact]
    public void True() => AssertType(LiteralType.FromClrType(true), "true");

    [Fact]
    public void False() => AssertType(LiteralType.FromClrType(false), "false");

    [Fact]
    public void StringLiteral() => AssertType(LiteralType.FromClrType("foo"), "\"foo\"");

    [Fact]
    public void Union() => AssertType(UnionType.Create(StandardTypes.Boolean, StandardTypes.Null), "Boolean | Null");

    private void AssertType(TybscriType expectedType, string typeString)
    {
        Assert.Equal(expectedType, _compiler.EvaluateType(typeString));
    }
}