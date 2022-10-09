using System;
using System.Text.Json;
using Tybscri.Common;
using Tybscri.TypeSerialization;
using Xunit;
using Xunit.Abstractions;

namespace Tybscri.Test;

public class EnvironmentTests
{
    private readonly ITestOutputHelper _testOutputHelper;
    private readonly TybscriCompiler _compiler;

    public EnvironmentTests(ITestOutputHelper testOutputHelper)
    {
        _testOutputHelper = testOutputHelper;
        _compiler = new TybscriCompiler();
    }

    [Fact]
    public void Use()
    {
        var env = new TestEnv { Input = 123 };
        var output = _compiler.EvaluateExpression<double, TestEnv>("input", env);
        Assert.Equal(123, output);
    }

    [Fact]
    public void Inspect()
    {
        var environment = _compiler.CreateEnvironment<TestEnv>();
        Assert.Collection(environment.Symbols, x => Assert.Equal("List", x.Name), x => Assert.Equal("Number", x.Name),
            x => Assert.Equal("Boolean", x.Name), x => Assert.Equal("Null", x.Name),
            x => Assert.Equal("String", x.Name), x => Assert.Equal("Void", x.Name), x => Assert.Equal("Never", x.Name),
            x => Assert.Equal("input", x.Name));
    }

    [Fact]
    public void Serialize()
    {
        var environment = _compiler.CreateEnvironment<TestEnv>();
        var environmentData = new EnvironmentData(environment);
        var json = JsonSerializer.Serialize(environmentData, new JsonSerializerOptions { WriteIndented = true });
        _testOutputHelper.WriteLine(json);
        Assert.Equal(@"{
  ""Symbols"": [
    {
      ""Name"": ""List"",
      ""Type"": {
        ""Kind"": ""ObjectDefinition""
      }
    },
    {
      ""Name"": ""Number"",
      ""Type"": {
        ""Kind"": ""ObjectDefinition""
      }
    },
    {
      ""Name"": ""Boolean"",
      ""Type"": {
        ""Kind"": ""ObjectDefinition""
      }
    },
    {
      ""Name"": ""Null"",
      ""Type"": {
        ""Kind"": ""ObjectDefinition""
      }
    },
    {
      ""Name"": ""String"",
      ""Type"": {
        ""Kind"": ""ObjectDefinition""
      }
    },
    {
      ""Name"": ""Void"",
      ""Type"": {
        ""Kind"": ""VoidDefinition""
      }
    },
    {
      ""Name"": ""Never"",
      ""Type"": {
        ""Kind"": ""VoidDefinition""
      }
    },
    {
      ""Name"": ""input"",
      ""Type"": {
        ""Kind"": ""Object""
      }
    }
  ]
}", json);
    }

    public class TestEnv
    {
        public double Input { get; set; }
    }
}