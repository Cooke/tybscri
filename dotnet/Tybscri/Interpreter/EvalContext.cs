using Tybscri.Symbols;

namespace Tybscri.Interpreter;

/// <summary>
/// Runtime context for the tree-walking interpreter.
/// Holds local variable values and provides access to globals.
/// </summary>
public class EvalContext
{
    /// <summary>
    /// Local variable values keyed by symbol.
    /// </summary>
    public Dictionary<ISymbol, object?> Locals { get; } = new();

    /// <summary>
    /// Values keyed by symbol name (for external symbols).
    /// </summary>
    public Dictionary<string, object?> NamedValues { get; } = new();

    /// <summary>
    /// The globals object passed to script execution.
    /// </summary>
    public object? Globals { get; init; }

    /// <summary>
    /// Creates a child scope that inherits globals but has fresh locals.
    /// </summary>
    public EvalContext CreateChildScope()
    {
        var child = new EvalContext { Globals = Globals };
        foreach (var kvp in NamedValues)
        {
            child.NamedValues[kvp.Key] = kvp.Value;
        }
        return child;
    }

    /// <summary>
    /// Creates a child scope that inherits both globals and existing locals.
    /// Used for block scopes where outer variables remain accessible.
    /// </summary>
    public EvalContext CreateChildScopeWithLocals()
    {
        var child = new EvalContext { Globals = Globals };
        foreach (var kvp in Locals)
        {
            child.Locals[kvp.Key] = kvp.Value;
        }
        foreach (var kvp in NamedValues)
        {
            child.NamedValues[kvp.Key] = kvp.Value;
        }
        return child;
    }

    /// <summary>
    /// Tries to get a value for a symbol, first by symbol reference, then by name.
    /// </summary>
    public bool TryGetValue(ISymbol symbol, out object? value)
    {
        if (Locals.TryGetValue(symbol, out value))
        {
            return true;
        }

        if (NamedValues.TryGetValue(symbol.Name, out value))
        {
            return true;
        }

        value = null;
        return false;
    }

    /// <summary>
    /// Sets a value for a symbol.
    /// </summary>
    public void SetValue(ISymbol symbol, object? value)
    {
        Locals[symbol] = value;
    }
}
