using Xunit;

namespace Tybscri.Test;

public class VariableTests
{
    private readonly Compiler _compiler;

    public VariableTests()
    {
        _compiler = Compiler.Default;
    }

    [Fact]
    public void DeclareWithInitialization()
    {
        _compiler.EvaluateScript("var hej = 1");
    }
}