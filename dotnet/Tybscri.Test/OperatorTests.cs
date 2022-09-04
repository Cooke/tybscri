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
}