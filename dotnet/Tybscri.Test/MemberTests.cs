using Xunit;

namespace Tybscri.Test;

public class MemberTests
{
    private readonly TybscriCompiler _compiler;

    public MemberTests()
    {
        _compiler = new TybscriCompiler();
    }

    [Fact]
    public void ReadProperty()
    {
        var input = new TestEnv { entity = new Entity() };
        var output = _compiler.EvaluateExpression<TestEnv, string>("entity.prop", input);
        Assert.Equal("hello", output);
    }

    public class TestEnv
    {
        public Entity entity { get; set; }
    }

    public class Entity
    {
        public string prop => "hello";
    }
}