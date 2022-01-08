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
        var input = new InputData { input = false };
        var output = _compiler.EvaluateExpression<InputData, double>("if (input) 1 else 0", input);
        Assert.Equal(0, output);
    }
    
    [Fact]
    public void False()
    {
        var input = new InputData { input = false };
        var output = _compiler.EvaluateExpression<InputData, double>("if (input) 1 else 0", input);
        Assert.Equal(1, output);
    }

    public class InputData
    {
        public bool input { get; set; }
    }
}