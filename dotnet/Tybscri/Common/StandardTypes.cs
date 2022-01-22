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

    public static readonly TybscriType Unknown = UnknownType.Instance;
}