using System.Threading.Tasks;
using Xunit;

namespace Tybscri.Test;

/// <summary>
/// Unified tests for script execution that run against both execution modes:
/// - Compiled (LINQ Expression compilation)
/// - Interpreted (tree-walking interpreter)
/// </summary>
public class InterpreterTests
{
    private readonly Compiler<TestEnvironment> _compiler;

    public InterpreterTests()
    {
        _compiler = Compiler.Create<TestEnvironment>();
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task SimpleConstant(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<double>("123", new TestEnvironment(), mode);
        Assert.Equal(123, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task StringConstant(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<string>("\"hello\"", new TestEnvironment(), mode);
        Assert.Equal("hello", result);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task BooleanConstant(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<bool>("true", new TestEnvironment(), mode);
        Assert.True(result);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task ArithmeticExpression(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<double>("1 + 2 * 3", new TestEnvironment(), mode);
        Assert.Equal(7, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task ComparisonExpression(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<bool>("5 > 3", new TestEnvironment(), mode);
        Assert.True(result);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task VariableDeclaration(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            var x = 10
            x
        ", new TestEnvironment(), mode);
        Assert.Equal(10, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task MultipleVariables(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            var x = 10
            var y = 20
            x + y
        ", new TestEnvironment(), mode);
        Assert.Equal(30, result);
    }

    // ============================================================
    // Interpreter-only tests for if expressions as return values
    // DotNext doesn't support conditional expressions in async context
    // ============================================================

    [Theory]
    [MemberData(nameof(TestModes.InterpretedOnly), MemberType = typeof(TestModes))]
    public async Task IfExpressionThen(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            if (true) { 1 } else { 2 }
        ", new TestEnvironment(), mode);
        Assert.Equal(1, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.InterpretedOnly), MemberType = typeof(TestModes))]
    public async Task IfExpressionElse(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            if (false) { 1 } else { 2 }
        ", new TestEnvironment(), mode);
        Assert.Equal(2, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task Return(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            return 123
        ", new TestEnvironment(), mode);
        Assert.Equal(123, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task CallGlobalFunction(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            add(3, 4)
        ", new TestEnvironment(), mode);
        Assert.Equal(7, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task CallAsyncFunction(ExecutionMode mode)
    {
        var testEnv = new TestEnvironment();
        var task = _compiler.ExecuteScriptAsync("wait()", testEnv, mode);
        Assert.False(task.IsCompleted);
        testEnv.Signal();
        await task;
        Assert.True(task.IsCompleted);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task CallAsyncFunctionWithReturn(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            asyncAdd(3, 4)
        ", new TestEnvironment(), mode);
        Assert.Equal(7, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task CollectionLiteral(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<System.Collections.Generic.List<double>>(@"
            [1, 2, 3]
        ", new TestEnvironment(), mode);
        Assert.Equal(new System.Collections.Generic.List<double> { 1, 2, 3 }, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.InterpretedOnly), MemberType = typeof(TestModes))]
    public async Task MemberAccess(ExecutionMode mode)
    {
        // Member access as implicit return requires conditional in async context
        var result = await _compiler.ExecuteScriptAsync<int>(@"
            ""hello"".length
        ", new TestEnvironment(), mode);
        Assert.Equal(5, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.InterpretedOnly), MemberType = typeof(TestModes))]
    public async Task AwaitInIfCondition(ExecutionMode mode)
    {
        // DotNext doesn't support conditional expressions in async context
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            if (asyncIsTrue()) {
                1
            } else {
                2
            }
        ", new TestEnvironment(), mode);
        Assert.Equal(1, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.InterpretedOnly), MemberType = typeof(TestModes))]
    public async Task AwaitInIfThenBranch(ExecutionMode mode)
    {
        // DotNext doesn't support conditional expressions in async context
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            if (true) {
                asyncAdd(1, 2)
            } else {
                0
            }
        ", new TestEnvironment(), mode);
        Assert.Equal(3, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.InterpretedOnly), MemberType = typeof(TestModes))]
    public async Task AwaitInIfElseBranch(ExecutionMode mode)
    {
        // DotNext doesn't support conditional expressions in async context
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            if (false) {
                0
            } else {
                asyncAdd(1, 2)
            }
        ", new TestEnvironment(), mode);
        Assert.Equal(3, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task NestedAwait(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            asyncAdd(asyncAdd(1, 2), asyncAdd(3, 4))
        ", new TestEnvironment(), mode);
        Assert.Equal(10, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task ShortCircuitAnd(ExecutionMode mode)
    {
        var testEnv = new TestEnvironment();
        var result = await _compiler.ExecuteScriptAsync<bool>(@"
            false && getSideEffect()
        ", testEnv, mode);
        Assert.False(result);
        Assert.False(testEnv.SideEffectCalled);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task ShortCircuitOr(ExecutionMode mode)
    {
        var testEnv = new TestEnvironment();
        var result = await _compiler.ExecuteScriptAsync<bool>(@"
            true || getSideEffect()
        ", testEnv, mode);
        Assert.True(result);
        Assert.False(testEnv.SideEffectCalled);
    }

    [Theory]
    [MemberData(nameof(TestModes.InterpretedOnly), MemberType = typeof(TestModes))]
    public async Task IfBlock(ExecutionMode mode)
    {
        // DotNext doesn't support conditional expressions in async context
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            if (true) {
                var x = 1
                var y = 2
                x + y
            } else { 0 }
        ", new TestEnvironment(), mode);
        Assert.Equal(3, result);
    }

    /// <summary>
    /// This test demonstrates what the tree-walking interpreter can do that
    /// the LINQ Expression compiler with DotNext cannot: multiple returns
    /// in async functions with early exit.
    /// </summary>
    [Theory]
    [MemberData(nameof(TestModes.InterpretedOnly), MemberType = typeof(TestModes))]
    public async Task EarlyReturn(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            if (true) {
                return 1
            }
            return 2
        ", new TestEnvironment(), mode);
        Assert.Equal(1, result);
    }

    /// <summary>
    /// Multiple returns in async context - only works with interpreter.
    /// </summary>
    [Theory]
    [MemberData(nameof(TestModes.InterpretedOnly), MemberType = typeof(TestModes))]
    public async Task MultipleReturnsInAsyncContext(ExecutionMode mode)
    {
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            if (1 < 10) {
                return 1
            }
            if (1 < 100) {
                return 2
            }
            return 3
        ", new TestEnvironment(), mode);
        Assert.Equal(1, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.InterpretedOnly), MemberType = typeof(TestModes))]
    public async Task MultipleReturnsWithConditions(ExecutionMode mode)
    {
        var result1 = await _compiler.ExecuteScriptAsync<double>(@"
            var x = 1
            if (x < 10) { return 1 }
            if (x < 100) { return 2 }
            return 3
        ", new TestEnvironment(), mode);
        Assert.Equal(1, result1);

        var result2 = await _compiler.ExecuteScriptAsync<double>(@"
            var x = 50
            if (x < 10) { return 1 }
            if (x < 100) { return 2 }
            return 3
        ", new TestEnvironment(), mode);
        Assert.Equal(2, result2);

        var result3 = await _compiler.ExecuteScriptAsync<double>(@"
            var x = 500
            if (x < 10) { return 1 }
            if (x < 100) { return 2 }
            return 3
        ", new TestEnvironment(), mode);
        Assert.Equal(3, result3);
    }

    private class TestEnvironment
    {
        private readonly TaskCompletionSource _completionSource = new();
        public bool SideEffectCalled { get; private set; }

        public Task Wait() => _completionSource.Task;

        public void Signal() => _completionSource.SetResult();

        public double Add(double a, double b) => a + b;

        public Task<double> AsyncAdd(double a, double b) => Task.FromResult(a + b);

        public Task<bool> AsyncIsTrue() => Task.FromResult(true);

        public bool GetSideEffect()
        {
            SideEffectCalled = true;
            return true;
        }
    }
}
