using Xunit;

namespace Tybscri.Test;

public class IdentifierTests
{
    private readonly TybscriCompiler _compiler;

    public IdentifierTests()
    {
        _compiler = new TybscriCompiler();
    }

    [Fact]
    public void Read()
    {
        var env = new TestEnv { Input = 123 };
        var output = _compiler.EvaluateExpression<double, TestEnv>("input", env);
        Assert.Equal(123, output);
    }

    public class TestEnv
    {
        public double Input { get; set; }
    }
}