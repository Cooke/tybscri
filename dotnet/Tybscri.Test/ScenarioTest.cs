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
        env.triggerEvent(eventData);
        Assert.True(eventData.handled);
    }

    private class TestEnvironment
    {
        private Action<EventData> handler;

        public void onEvent(Action<EventData> handler)
        {
            this.handler = handler;
        }

        public void triggerEvent(EventData eventData)
        {
            handler(eventData);
        }
    }

    private class EventData
    {
        public bool handled;

        public void reportHandled()
        {
            handled = true;
        }
    }
}