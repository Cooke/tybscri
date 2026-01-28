namespace Tybscri.Interpreter;

/// <summary>
/// Exception used to signal early returns from script execution.
/// This allows return statements to unwind the call stack during interpretation.
/// </summary>
public class ReturnException : Exception
{
    /// <summary>
    /// The value being returned.
    /// </summary>
    public object? Value { get; }

    public ReturnException(object? value)
    {
        Value = value;
    }
}
