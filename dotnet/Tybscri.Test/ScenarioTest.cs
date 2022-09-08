using System;
using Xunit;

namespace Tybscri.Test;

public class ScenarioTests
{
    private readonly TybscriCompiler _compiler;

    public ScenarioTests()
    {
        _compiler = new TybscriCompiler();
    }

    [Fact]
    public void HandleEvent()
    {
        var env = new TestEnvironment();
        _compiler.EvaluateScript(@"
            onEvent { it.reportHandled() }
        ", env);
        var eventData = new EventData();
        env.TriggerEvent(eventData);
        Assert.True(eventData.Handled);
    }

    private class TestEnvironment
    {
        private Action<EventData>? _handler;

        // ReSharper disable once UnusedMember.Local
        public void OnEvent(Action<EventData> newHandler)
        {
            _handler = newHandler;
        }

        public void TriggerEvent(EventData eventData)
        {
            _handler?.Invoke(eventData);
        }
    }

    private class EventData
    {
        public bool Handled;

        public void ReportHandled()
        {
            Handled = true;
        }
    }
}