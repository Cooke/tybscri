using Xunit;

namespace Tybscri.Test;

public class VariableTests
{
    private readonly TybscriCompiler _compiler;

    public VariableTests()
    {
        _compiler = new TybscriCompiler();
    }

    [Fact]
    public void DeclareWithInitialization()
    {
        _compiler.EvaluateScript("var hej = 1");
    }
}