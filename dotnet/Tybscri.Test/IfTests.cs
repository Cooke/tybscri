using Xunit;

namespace Tybscri.Test;

public class IfTests
{
    private readonly TybscriCompiler _compiler;

    public IfTests()
    {
        _compiler = new TybscriCompiler();
    }

    [Fact]
    public void True()
    {
        var input = new TestEnv { input = false };
        var output = _compiler.EvaluateExpression<double, TestEnv>("if (input) 1 else 0", input);
        Assert.Equal(0, output);
    }

    [Fact]
    public void False()
    {
        var input = new TestEnv { input = false };
        var output = _compiler.EvaluateExpression<double, TestEnv>("if (input) 1 else 0", input);
        Assert.Equal(0, output);
    }

    public class TestEnv
    {
        public bool input { get; set; }
    }
}