namespace Tybscri.Interpreter;

/// <summary>
/// Exception used to signal continue statements in loop execution.
/// This allows continue statements to skip to the next iteration during interpretation.
/// </summary>
public class ContinueException : Exception
{
    public ContinueException()
    {
    }
}
