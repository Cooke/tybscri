using System.Threading.Tasks;
using Xunit;

namespace Tybscri.Test;

/// <summary>
/// Tests for async script execution that run against both execution modes.
/// </summary>
public class AsyncScriptTests
{
    private readonly Compiler<TestEnvironment> _compiler;

    public AsyncScriptTests()
    {
        _compiler = Compiler.Create<TestEnvironment>();
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task Invoke(ExecutionMode mode)
    {
        var globals = new TestEnvironment();
        var scriptTask = _compiler.ExecuteScriptAsync(@"
            wait()
            ", globals, mode);
        Assert.False(scriptTask.IsCompleted);
        globals.Signal();
        await scriptTask;
        Assert.True(scriptTask.IsCompleted);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task InvokeImplicitReturn(ExecutionMode mode)
    {
        var testEnv = new TestEnvironment();
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            nowait(1)
            ", testEnv, mode);
        Assert.Equal(1, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task ReturnValue(ExecutionMode mode)
    {
        var testEnv = new TestEnvironment();
        var result = await _compiler.ExecuteScriptAsync<double>(@"
            return nowait(1)
            ", testEnv, mode);
        Assert.Equal(1, result);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task ReturnVoid(ExecutionMode mode)
    {
        var testEnv = new TestEnvironment();
        await _compiler.ExecuteScriptAsync(@"
            nowait(1)
            return
            ", testEnv, mode);
    }

    [Theory]
    [MemberData(nameof(TestModes.AllModes), MemberType = typeof(TestModes))]
    public async Task IgnoreImplicitReturn(ExecutionMode mode)
    {
        var testEnv = new TestEnvironment();
        await _compiler.ExecuteScriptAsync(@"
            nowait(1)
            ", testEnv, mode);
    }

    private class TestEnvironment
    {
        private readonly TaskCompletionSource _completionSource = new();

        public Task Wait() => _completionSource.Task;

        public Task<double> Nowait(double num) => Task.FromResult(num);

        public void Signal() => _completionSource.SetResult();
    }
}
