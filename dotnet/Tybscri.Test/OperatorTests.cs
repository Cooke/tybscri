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
        var output = _compiler.EvaluateExpression<bool>("0 < 1");
        Assert.True(output);
    }
}