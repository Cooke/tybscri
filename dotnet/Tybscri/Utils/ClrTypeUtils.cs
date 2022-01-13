namespace Tybscri.Utils;

internal class ClrTypeUtils
{
    public static Type FindCommonType(Type type1, params Type[] types)
    {
        if (types.Length == 0) {
            return type1;
        }

        // Simple implementation that may need to be improved. This simplification may cause
        // unnecessary boxing 
        if (types.All(x => type1 == x)) {
            return type1;
        }

        return typeof(object);
    }
}