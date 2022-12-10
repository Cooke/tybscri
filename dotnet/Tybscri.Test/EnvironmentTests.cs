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
    private readonly Compiler<TestEnv> _compiler;

    public EnvironmentTests(ITestOutputHelper testOutputHelper)
    {
        _testOutputHelper = testOutputHelper;
        _compiler = Compiler.Create<TestEnv>();
    }

    [Fact]
    public void Use()
    {
        var env = new TestEnv { Input = 123 };
        var output = _compiler.EvaluateExpression<double>("input", env);
        Assert.Equal(123, output);
    }

    [Fact]
    public void Inspect()
    {
        var environment = _compiler.Environment;
        Assert.Collection(environment.Symbols, x => Assert.Equal("List", x.Name), x => Assert.Equal("Number", x.Name),
            x => Assert.Equal("Boolean", x.Name), x => Assert.Equal("Null", x.Name),
            x => Assert.Equal("String", x.Name), x => Assert.Equal("Void", x.Name), x => Assert.Equal("Never", x.Name),
            x => Assert.Equal("input", x.Name));
    }

    [Fact]
    public void Serialize()
    {
        var environment = _compiler.Environment;
        var environmentData = new EnvironmentData(environment);
        var json = JsonSerializer.Serialize(environmentData,
            new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        _testOutputHelper.WriteLine(json);
        Assert.Equal(@"{
  ""symbols"": [
    {
      ""name"": ""List"",
      ""type"": {
        ""name"": ""List"",
        ""base"": null,
        ""members"": [
          {
            ""name"": ""filter"",
            ""settable"": false,
            ""type"": {
              ""parameters"": [
                {
                  ""name"": ""item"",
                  ""type"": {
                    ""name"": ""T"",
                    ""kind"": ""TypeReference""
                  }
                }
              ],
              ""returnType"": {
                ""definitionName"": ""Boolean"",
                ""typeArguments"": [],
                ""kind"": ""Object""
              },
              ""kind"": ""Func""
            },
            ""typeParameters"": []
          }
        ],
        ""typeParameters"": [
          {
            ""name"": ""T"",
            ""variance"": ""None""
          }
        ],
        ""kind"": ""ObjectDefinition""
      }
    },
    {
      ""name"": ""Number"",
      ""type"": {
        ""name"": ""Number"",
        ""base"": null,
        ""members"": [],
        ""typeParameters"": [],
        ""kind"": ""ObjectDefinition""
      }
    },
    {
      ""name"": ""Boolean"",
      ""type"": {
        ""name"": ""Boolean"",
        ""base"": null,
        ""members"": [],
        ""typeParameters"": [],
        ""kind"": ""ObjectDefinition""
      }
    },
    {
      ""name"": ""Null"",
      ""type"": {
        ""name"": ""Null"",
        ""base"": null,
        ""members"": [],
        ""typeParameters"": [],
        ""kind"": ""ObjectDefinition""
      }
    },
    {
      ""name"": ""String"",
      ""type"": {
        ""name"": ""String"",
        ""base"": null,
        ""members"": [
          {
            ""name"": ""length"",
            ""settable"": false,
            ""type"": {
              ""definitionName"": ""Number"",
              ""typeArguments"": [],
              ""kind"": ""Object""
            },
            ""typeParameters"": []
          }
        ],
        ""typeParameters"": [],
        ""kind"": ""ObjectDefinition""
      }
    },
    {
      ""name"": ""Void"",
      ""type"": {
        ""name"": ""Void"",
        ""kind"": ""VoidDefinition""
      }
    },
    {
      ""name"": ""Never"",
      ""type"": {
        ""name"": ""Never"",
        ""kind"": ""NeverDefinition""
      }
    },
    {
      ""name"": ""input"",
      ""type"": {
        ""definitionName"": ""Number"",
        ""typeArguments"": [],
        ""kind"": ""Object""
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