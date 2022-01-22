namespace Tybscri;

public static class StandardTypes
{
    public static TybscriType Number = new ObjectType(typeof(double),
        new Lazy<IReadOnlyCollection<TybscriMember>>(Array.Empty<TybscriMember>));

    public static TybscriType String = new ObjectType(typeof(string),
        new Lazy<IReadOnlyCollection<TybscriMember>>(Array.Empty<TybscriMember>));

    public static TybscriType Null = new ObjectType(typeof(object),
        new Lazy<IReadOnlyCollection<TybscriMember>>(Array.Empty<TybscriMember>));

    public static TybscriType Boolean = new ObjectType(typeof(bool),
        new Lazy<IReadOnlyCollection<TybscriMember>>(Array.Empty<TybscriMember>));
}