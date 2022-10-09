using System.Linq.Expressions;
using System.Reflection;

namespace Tybscri.Common;

public static class StandardTypes
{
    private static readonly TypeParameter ItemTypeParameter =
        new TypeParameter("T", typeof(List<>).GetGenericArguments()[0]);

    public static readonly ObjectDefinitionType List = new("List", typeof(List<>), new[] { ItemTypeParameter },
        new Lazy<IReadOnlyCollection<TybscriMember>>(() => new[]
        {
            new TybscriMember("filter",
                new FuncType(Boolean!, new[] { new FuncParameter("item", ItemTypeParameter) }),
                typeof(Enumerable).GetMember("Where").First())
        }));

    public static readonly ObjectDefinitionType NumberDefinition = new("Number", typeof(double),
        ArraySegment<TypeParameter>.Empty, new Lazy<IReadOnlyCollection<TybscriMember>>(Array.Empty<TybscriMember>));

    public static readonly ObjectType Number = NumberDefinition.CreateType();

    public static readonly ObjectDefinitionType StringDefinition = new("String", typeof(string),
        ArraySegment<TypeParameter>.Empty,
        new Lazy<IReadOnlyCollection<TybscriMember>>(() => new[]
        {
            new TybscriMember("length", Number, typeof(string).GetProperty("Length")!)
        }));

    public static readonly ObjectType String = StringDefinition.CreateType();

    public static readonly ObjectDefinitionType NullDefinition = new("Null", typeof(object),
        ArraySegment<TypeParameter>.Empty, new Lazy<IReadOnlyCollection<TybscriMember>>(Array.Empty<TybscriMember>));

    public static readonly ObjectType Null = NullDefinition.CreateType();

    public static readonly ObjectDefinitionType BooleanDefinition = new("Boolean", typeof(bool),
        ArraySegment<TypeParameter>.Empty, new Lazy<IReadOnlyCollection<TybscriMember>>(Array.Empty<TybscriMember>));

    public static readonly ObjectType Boolean = BooleanDefinition.CreateType();

    // Fallback type if another type cannot be calculated. Any unknown type
    // is an error condition, the program should not compile.
    public static readonly TybscriType Unknown = UnknownType.Instance;

    // If function never returns, a value will never be calculated etc.
    // Basically the empty set of values
    public static readonly VoidDefinitionType NeverDefinition = new VoidDefinitionType("Never");
    public static readonly TybscriType Never = NeverType.Instance;

    // A function that does not return anything useful returns void.
    // A variable may not be assigned to void.
    public static readonly VoidDefinitionType VoidDefinition = new VoidDefinitionType("Void");
    public static readonly TybscriType Void = VoidDefinition.CreateType();
}