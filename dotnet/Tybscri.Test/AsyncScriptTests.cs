using System.Threading.Tasks;
using Xunit;

namespace Tybscri.Test;

public class AsyncScriptTests
{
    private readonly Compiler<TestEnvironment> _compiler;

    public AsyncScriptTests()
    {
        _compiler = Compiler.Create<TestEnvironment>();
    }

    [Fact]
    public void Invoke()
    {
        var globals = new TestEnvironment();
        var scriptTask = _compiler.EvaluateScriptAsync(@"
            wait()
            ", globals);
        Assert.False(scriptTask.IsCompleted);
        globals.Signal();
        Assert.True(scriptTask.IsCompleted);
    }

    [Fact]
    public void InvokeImplicitReturn()
    {
        var testEnv = new TestEnvironment();
        var scriptTask = _compiler.EvaluateScriptAsync<double>(@"
            nowait(1)
            ", testEnv);
        Assert.Equal(1, scriptTask.Result);
    }

    [Fact]
    public void ReturnValue()
    {
        var testEnv = new TestEnvironment();
        var scriptTask = _compiler.EvaluateScriptAsync<double>(@"
            return nowait(1)
            ", testEnv);
        Assert.True(scriptTask.IsCompleted);
        Assert.Equal(1, scriptTask.Result);
    }

    [Fact]
    public void ReturnVoid()
    {
        var testEnv = new TestEnvironment();
        var scriptTask = _compiler.EvaluateScriptAsync(@"
            nowait(1)
            return
            ", testEnv);
        Assert.True(scriptTask.IsCompleted);
    }
    
    [Fact]
    public void IgnoreImplicitReturn()
    {
        var testEnv = new TestEnvironment();
        var scriptTask = _compiler.EvaluateScriptAsync(@"
            nowait(1)
            ", testEnv);
        Assert.True(scriptTask.IsCompleted);
    }

    private class TestEnvironment
    {
        private readonly TaskCompletionSource _completionSource = new();

        public Task Wait() => _completionSource.Task;

        public Task<double> Nowait(double num) => Task.FromResult(num);

        public void Signal() => _completionSource.SetResult();
    }
}