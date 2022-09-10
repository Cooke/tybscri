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
    public void Number() => AssertType(StandardTypes.Number, "number");

    [Fact]
    public void Boolean() => AssertType(StandardTypes.Boolean, "boolean");

    [Fact]
    public void String() => AssertType(StandardTypes.String, "string");

    [Fact]
    public void Null() => AssertType(StandardTypes.Null, "null");

    [Fact]
    public void NumberLiteral() => AssertType(new NumberLiteralType(123), "123");

    [Fact]
    public void True() => AssertType(new BooleanLiteralType(true), "true");

    [Fact]
    public void False() => AssertType(new BooleanLiteralType(false), "false");

    [Fact]
    public void StringLiteral() => AssertType(new StringLiteralType("foo"), "\"foo\"");

    [Fact]
    public void Union() => AssertType(UnionType.Create(StandardTypes.Boolean, StandardTypes.Null), "boolean | null");

    private void AssertType(TybscriType expectedType, string typeString)
    {
        Assert.Equal(expectedType, _compiler.EvaluateType(typeString));
    }
}