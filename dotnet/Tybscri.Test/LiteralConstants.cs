using Xunit;

namespace Tybscri.Test;

public class LiteralConstantsTests
{
    private readonly TybscriCompiler _compiler;

    public LiteralConstantsTests()
    {
        _compiler = new TybscriCompiler();
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
}