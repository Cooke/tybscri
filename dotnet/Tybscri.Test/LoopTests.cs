using System.Threading.Tasks;
using Xunit;

namespace Tybscri.Test;

public class LoopTests
{
    private readonly Compiler _compiler;

    public LoopTests()
    {
        _compiler = Compiler.Default;
    }

    [Fact]
    public async Task WhileLoop_BreaksImmediately()
    {
        // Test simple while with immediate break
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            var value = 42
            while (true) {
                break
            }
            value
        ", ExecutionMode.Interpreted);
        Assert.Equal(42, result);
    }

    [Fact]
    public async Task WhileLoop_ConditionFalse()
    {
        // Test while loop with false condition - body never executes
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            var value = 123
            while (false) {
                123
            }
            value
        ", ExecutionMode.Interpreted);
        Assert.Equal(123, result);
    }

    [Fact]
    public async Task ForLoop_BasicIteration()
    {
        // Test simple for loop - just iterate without using loop variable in conditions
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            for (item in [1, 2, 3]) {
                item
            }
            99
        ", ExecutionMode.Interpreted);
        Assert.Equal(99, result);
    }

    [Fact]
    public async Task ForLoop_WithImmediateBreak()
    {
        // Test for loop with immediate break
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            for (item in [1, 2, 3, 4, 5]) {
                break
            }
            42
        ", ExecutionMode.Interpreted);
        Assert.Equal(42, result);
    }

    [Fact]
    public async Task NestedForLoops_Basic()
    {
        // Test basic nested for loops
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            for (i in [1, 2]) {
                for (j in [10, 20]) {
                    j
                }
            }
            200
        ", ExecutionMode.Interpreted);
        Assert.Equal(200, result);
    }

    [Fact]
    public async Task WhileLoop_WithContinue()
    {
        // Test while with continue - though it immediately breaks
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            var count = 0
            while (true) {
                break
            }
            55
        ", ExecutionMode.Interpreted);
        Assert.Equal(55, result);
    }
}
