using Xunit;

namespace Tybscri.Test;

public class MemberTests
{
    private readonly Compiler<TestEnv> _compiler;

    public MemberTests()
    {
        _compiler = Compiler.Create<TestEnv>();
    }

    [Fact]
    public void ReadProperty()
    {
        var input = new TestEnv { entity = new Entity() };
        var output = _compiler.EvaluateExpression<string>("entity.prop", input);
        Assert.Equal("hello", output);
    }

    [Fact]
    public void InvokeMember()
    {
        var input = new TestEnv { entity = new Entity() };
        var output = _compiler.EvaluateExpression<double>("entity.execute()", input);
        Assert.Equal(1337, output);
    }
    
    [Fact]
    public void InvokeMemberWithArguments()
    {
        var input = new TestEnv { entity = new Entity() };
        var output = _compiler.EvaluateExpression<double>("entity.add(1, 2)", input);
        Assert.Equal(3, output);
    }
    
    [Fact]
    public void ReadPropertyOfProperty()
    {
        var input = new TestEnv { entity = new Entity() };
        var output = _compiler.EvaluateExpression<double>("entity.prop.length", input);
        Assert.Equal(5, output);
    }

    public class TestEnv
    {
        public Entity entity { get; set; }
    }

    public class Entity
    {
        public string prop => "hello";

        public double execute() => 1337;
        
        public double add(double term1, double term2) => term1 + term2;
    }
}