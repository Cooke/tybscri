using System.Collections.Immutable;

namespace Tybscri.Utils;

internal class ClrTypeUtils
{
    public static Type FindCommonType(Type type1, params Type[] types)
    {
        if (types.Length == 0) {
            return type1;
        }

        return FindCommonType(new[] { type1 }.Concat(types).ToArray());
    }

    public static Type FindCommonType(IReadOnlyCollection<Type> types)
    {
        if (types.Count == 0) {
            throw new ArgumentException("List of types is empty");
        }

        var resultTypes = new List<Type>();
        foreach (var type in types) {
            if (!resultTypes.Any(t => type.IsAssignableTo(t))) {
                for (var i = resultTypes.Count - 1; i >= 0; i--) {
                    if (resultTypes[i].IsAssignableTo(type)) {
                        resultTypes.RemoveAt(i);
                    }
                }

                resultTypes.Add(type);
            }
        }

        if (resultTypes.Count == 1) {
            return resultTypes[0];
        }

        return typeof(object);
    }
}