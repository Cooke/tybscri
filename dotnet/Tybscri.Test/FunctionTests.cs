using Xunit;

namespace Tybscri.Test;

public class FunctionTests
{
    private readonly TybscriCompiler _compiler;

    public FunctionTests()
    {
        _compiler = new TybscriCompiler();
    }

    [Fact]
    public void Invoke()
    {
        var output = _compiler.EvaluateScript<string>(@"
            fun hello() {
                ""hello""
            }
            hello()
            ");
        Assert.Equal("hello", output);
    }
}