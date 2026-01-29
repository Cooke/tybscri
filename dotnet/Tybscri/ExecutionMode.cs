namespace Tybscri;

/// <summary>
/// Specifies the execution strategy for running Tybscri scripts.
/// </summary>
public enum ExecutionMode
{
    /// <summary>
    /// Compiles scripts to LINQ Expressions for JIT compilation.
    /// Offers best performance but has some async limitations with DotNext.
    /// </summary>
    Compiled,

    /// <summary>
    /// Uses a tree-walking interpreter for script execution.
    /// Supports full async capabilities including await in loops and conditionals.
    /// </summary>
    Interpreted
}
