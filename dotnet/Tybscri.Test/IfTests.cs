using Tybscri.Common;
using Xunit;

namespace Tybscri.Test;

public class IfTests
{
    private readonly Compiler _compiler;

    public IfTests()
    {
        _compiler = Compiler.Default;
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
        var output = _compiler.EvaluateExpression<object>("if (false) 33",
            UnionType.Create(StandardTypes.Number, StandardTypes.Null));
        Assert.Null(output);
    }

    [Fact]
    public void TrueIfWithoutElse()
    {
        var expectedType = _compiler.EvaluateType("Number | Null");
        var output = _compiler.EvaluateExpression<object>("if (true) 33", expectedType);
        Assert.Equal(33d, output);
    }
}