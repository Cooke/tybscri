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
        var output = _compiler.EvaluateExpression<double>("if (true) 111 else 222");
        Assert.Equal(111, output);
    }

    [Fact]
    public void False()
    {
        var output = _compiler.EvaluateExpression<double>("if (false) 33 else 44");
        Assert.Equal(44, output);
    }
    
    [Fact]
    public void FalseIfWithoutElse()
    {
        var output = _compiler.EvaluateExpression<object>("if (false) 33");
        Assert.Null(output);
    }
    
    [Fact]
    public void TrueIfWithoutElse()
    {
        var output = _compiler.EvaluateExpression<object>("if (true) 33");
        Assert.Equal(33d, output);
    }
}