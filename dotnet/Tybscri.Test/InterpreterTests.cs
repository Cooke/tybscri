using System.Threading.Tasks;
using Xunit;

namespace Tybscri.Test;

/// <summary>
/// Tests for the tree-walking async interpreter.
/// These tests exercise the InterpretScriptAsync methods which use
/// the interpreter instead of LINQ Expression compilation.
/// </summary>
public class InterpreterTests
{
    private readonly Compiler<TestEnvironment> _compiler;

    public InterpreterTests()
    {
        _compiler = Compiler.Create<TestEnvironment>();
    }

    [Fact]
    public async Task SimpleConstant()
    {
        var result = await _compiler.InterpretScriptAsync<double>("123", new TestEnvironment());
        Assert.Equal(123, result);
    }

    [Fact]
    public async Task StringConstant()
    {
        var result = await _compiler.InterpretScriptAsync<string>("\"hello\"", new TestEnvironment());
        Assert.Equal("hello", result);
    }

    [Fact]
    public async Task BooleanConstant()
    {
        var result = await _compiler.InterpretScriptAsync<bool>("true", new TestEnvironment());
        Assert.True(result);
    }

    [Fact]
    public async Task ArithmeticExpression()
    {
        var result = await _compiler.InterpretScriptAsync<double>("1 + 2 * 3", new TestEnvironment());
        Assert.Equal(7, result);
    }

    [Fact]
    public async Task ComparisonExpression()
    {
        var result = await _compiler.InterpretScriptAsync<bool>("5 > 3", new TestEnvironment());
        Assert.True(result);
    }

    [Fact]
    public async Task VariableDeclaration()
    {
        var result = await _compiler.InterpretScriptAsync<double>(@"
            var x = 10
            x
        ", new TestEnvironment());
        Assert.Equal(10, result);
    }

    [Fact]
    public async Task MultipleVariables()
    {
        var result = await _compiler.InterpretScriptAsync<double>(@"
            var x = 10
            var y = 20
            x + y
        ", new TestEnvironment());
        Assert.Equal(30, result);
    }

    [Fact]
    public async Task IfExpressionThen()
    {
        var result = await _compiler.InterpretScriptAsync<double>(@"
            if (true) { 1 } else { 2 }
        ", new TestEnvironment());
        Assert.Equal(1, result);
    }

    [Fact]
    public async Task IfExpressionElse()
    {
        var result = await _compiler.InterpretScriptAsync<double>(@"
            if (false) { 1 } else { 2 }
        ", new TestEnvironment());
        Assert.Equal(2, result);
    }

    [Fact]
    public async Task Return()
    {
        var result = await _compiler.InterpretScriptAsync<double>(@"
            return 123
        ", new TestEnvironment());
        Assert.Equal(123, result);
    }

    [Fact]
    public async Task EarlyReturn()
    {
        var result = await _compiler.InterpretScriptAsync<double>(@"
            if (true) {
                return 1
            }
            return 2
        ", new TestEnvironment());
        Assert.Equal(1, result);
    }

    [Fact]
    public async Task CallGlobalFunction()
    {
        var result = await _compiler.InterpretScriptAsync<double>(@"
            add(3, 4)
        ", new TestEnvironment());
        Assert.Equal(7, result);
    }

    [Fact]
    public async Task CallAsyncFunction()
    {
        var testEnv = new TestEnvironment();
        var task = _compiler.InterpretScriptAsync("wait()", testEnv);
        Assert.False(task.IsCompleted);
        testEnv.Signal();
        await task;
        Assert.True(task.IsCompleted);
    }

    [Fact]
    public async Task CallAsyncFunctionWithReturn()
    {
        var result = await _compiler.InterpretScriptAsync<double>(@"
            asyncAdd(3, 4)
        ", new TestEnvironment());
        Assert.Equal(7, result);
    }

    [Fact]
    public async Task CollectionLiteral()
    {
        var result = await _compiler.InterpretScriptAsync<System.Collections.Generic.List<double>>(@"
            [1, 2, 3]
        ", new TestEnvironment());
        Assert.Equal(new System.Collections.Generic.List<double> { 1, 2, 3 }, result);
    }

    [Fact]
    public async Task MemberAccess()
    {
        // Note: String.length returns an int in .NET
        var result = await _compiler.InterpretScriptAsync<int>(@"
            ""hello"".length
        ", new TestEnvironment());
        Assert.Equal(5, result);
    }

    [Fact]
    public async Task AwaitInIfCondition()
    {
        var result = await _compiler.InterpretScriptAsync<double>(@"
            if (asyncIsTrue()) {
                1
            } else {
                2
            }
        ", new TestEnvironment());
        Assert.Equal(1, result);
    }

    [Fact]
    public async Task AwaitInIfThenBranch()
    {
        var result = await _compiler.InterpretScriptAsync<double>(@"
            if (true) {
                asyncAdd(1, 2)
            } else {
                0
            }
        ", new TestEnvironment());
        Assert.Equal(3, result);
    }

    [Fact]
    public async Task AwaitInIfElseBranch()
    {
        var result = await _compiler.InterpretScriptAsync<double>(@"
            if (false) {
                0
            } else {
                asyncAdd(1, 2)
            }
        ", new TestEnvironment());
        Assert.Equal(3, result);
    }

    [Fact]
    public async Task NestedAwait()
    {
        var result = await _compiler.InterpretScriptAsync<double>(@"
            asyncAdd(asyncAdd(1, 2), asyncAdd(3, 4))
        ", new TestEnvironment());
        Assert.Equal(10, result);
    }

    [Fact]
    public async Task ShortCircuitAnd()
    {
        var testEnv = new TestEnvironment();
        var result = await _compiler.InterpretScriptAsync<bool>(@"
            false && getSideEffect()
        ", testEnv);
        Assert.False(result);
        Assert.False(testEnv.SideEffectCalled);
    }

    [Fact]
    public async Task ShortCircuitOr()
    {
        var testEnv = new TestEnvironment();
        var result = await _compiler.InterpretScriptAsync<bool>(@"
            true || getSideEffect()
        ", testEnv);
        Assert.True(result);
        Assert.False(testEnv.SideEffectCalled);
    }

    [Fact]
    public async Task IfBlock()
    {
        // Test block-like behavior via if expression
        // (standalone blocks are parsed as lambda literals in Tybscri)
        var result = await _compiler.InterpretScriptAsync<double>(@"
            if (true) {
                var x = 1
                var y = 2
                x + y
            } else { 0 }
        ", new TestEnvironment());
        Assert.Equal(3, result);
    }

    /// <summary>
    /// This test demonstrates what the tree-walking interpreter can do that
    /// the LINQ Expression compiler with DotNext cannot: multiple returns
    /// in async functions.
    /// </summary>
    [Fact]
    public async Task MultipleReturnsInAsyncContext()
    {
        // This pattern fails with the LINQ Expression + DotNext approach
        // but works perfectly with the tree-walking interpreter
        var result = await _compiler.InterpretScriptAsync<double>(@"
            if (1 < 10) {
                return 1
            }
            if (1 < 100) {
                return 2
            }
            return 3
        ", new TestEnvironment());
        Assert.Equal(1, result);
    }

    [Fact]
    public async Task MultipleReturnsWithConditions()
    {
        var result1 = await _compiler.InterpretScriptAsync<double>(@"
            var x = 1
            if (x < 10) { return 1 }
            if (x < 100) { return 2 }
            return 3
        ", new TestEnvironment());
        Assert.Equal(1, result1);

        var result2 = await _compiler.InterpretScriptAsync<double>(@"
            var x = 50
            if (x < 10) { return 1 }
            if (x < 100) { return 2 }
            return 3
        ", new TestEnvironment());
        Assert.Equal(2, result2);

        var result3 = await _compiler.InterpretScriptAsync<double>(@"
            var x = 500
            if (x < 10) { return 1 }
            if (x < 100) { return 2 }
            return 3
        ", new TestEnvironment());
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
