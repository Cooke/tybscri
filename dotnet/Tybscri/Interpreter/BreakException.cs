namespace Tybscri.Interpreter;

/// <summary>
/// Exception used to signal break statements in loop execution.
/// This allows break statements to unwind the call stack during interpretation.
/// </summary>
public class BreakException : Exception
{
    public BreakException()
    {
    }
}
