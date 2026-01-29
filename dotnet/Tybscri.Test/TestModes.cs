using System.Collections.Generic;

namespace Tybscri.Test;

/// <summary>
/// Provides test data for parameterized tests that run against both execution modes.
/// </summary>
public static class TestModes
{
    /// <summary>
    /// Returns all execution modes for use with [MemberData].
    /// </summary>
    public static IEnumerable<object[]> AllModes()
    {
        yield return new object[] { ExecutionMode.Compiled };
        yield return new object[] { ExecutionMode.Interpreted };
    }

    /// <summary>
    /// Returns only the interpreted mode for tests that don't work with compiled mode.
    /// </summary>
    public static IEnumerable<object[]> InterpretedOnly()
    {
        yield return new object[] { ExecutionMode.Interpreted };
    }

    /// <summary>
    /// Returns only the compiled mode for tests that don't work with interpreted mode.
    /// </summary>
    public static IEnumerable<object[]> CompiledOnly()
    {
        yield return new object[] { ExecutionMode.Compiled };
    }
}
