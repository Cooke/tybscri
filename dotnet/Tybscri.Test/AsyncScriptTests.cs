using System.Threading.Tasks;
using Xunit;

namespace Tybscri.Test;

public class AsyncScriptTests
{
    private readonly TybscriCompiler _compiler;

    public AsyncScriptTests()
    {
        _compiler = new TybscriCompiler();
    }

    [Fact]
    public void Invoke()
    {
        var testEnv = new TestEnvironment();
        var scriptTask = _compiler.EvaluateScriptAsync(@"
            wait()
            ", testEnv);
        Assert.False(scriptTask.IsCompleted);
        testEnv.Signal();
        Assert.True(scriptTask.IsCompleted);
    }

    [Fact]
    public void InvokeImplicitReturn()
    {
        var testEnv = new TestEnvironment();
        var scriptTask = _compiler.EvaluateScriptAsync<double, TestEnvironment>(@"
            nowait(1)
            ", testEnv);
        Assert.Equal(1, scriptTask.Result);
    }

    [Fact]
    public void ReturnValue()
    {
        var testEnv = new TestEnvironment();
        var scriptTask = _compiler.EvaluateScriptAsync<double, TestEnvironment>(@"
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