using System.Linq.Expressions;

namespace Tybscri;

public static class StandardTypes
{
    public static readonly TybscriType Number = new ObjectType(typeof(double),
        new Lazy<IReadOnlyCollection<TybscriMember>>(Array.Empty<TybscriMember>));

    public static readonly TybscriType String = new ObjectType(typeof(string),
        new Lazy<IReadOnlyCollection<TybscriMember>>(() => new[]
        {
            new TybscriMember("length", Number, typeof(string).GetProperty("Length")!)
        }));

    public static readonly TybscriType Null = new ObjectType(typeof(object),
        new Lazy<IReadOnlyCollection<TybscriMember>>(Array.Empty<TybscriMember>));

    public static readonly TybscriType Boolean = new ObjectType(typeof(bool),
        new Lazy<IReadOnlyCollection<TybscriMember>>(Array.Empty<TybscriMember>));

    // Fallback type if another type cannot be calculated. Any unknown type
    // is an error condition, the program should not compile.
    public static readonly TybscriType Unknown = UnknownType.Instance;

    // If function never returns, a value will never be calculated etc.
    // Basically the empty set of values
    public static readonly TybscriType Never = NeverType.Instance;
    
    // A function that does not return anything useful returns void.
    // A variable may not be assigned to void.
    public static readonly TybscriType Void = VoidType.Instance;
}