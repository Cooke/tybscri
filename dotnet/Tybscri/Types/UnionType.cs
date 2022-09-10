using System.Collections.Immutable;
using Tybscri.Common;

namespace Tybscri;

public class UnionType : TybscriType
{
    private readonly IImmutableSet<TybscriType> _types;

    public static TybscriType Create(params TybscriType[] types)
    {
        if (types.Length == 0) {
            return NeverType.Instance;
        }

        if (types.Length == 1) {
            return types[0];
        }

        var resultTypes = new HashSet<TybscriType>(types.Length);
        foreach (var type in types.Where(x => !x.Equals(StandardTypes.Never))) {
            if (!resultTypes.Any(x => x.IsAssignableFrom(type))) {
                resultTypes.RemoveWhere(type.IsAssignableFrom);
                resultTypes.Add(type);
            }
        }

        if (resultTypes.Count == 0) {
            return StandardTypes.Never;
        }

        if (resultTypes.Count == 1) {
            return resultTypes.First();
        }

        return new UnionType(resultTypes.ToImmutableHashSet());
    }


    private UnionType(IImmutableSet<TybscriType> types)
    {
        _types = types;
    }

    public override Type ClrType => typeof(object);

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        throw new NotImplementedException();
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return _types.Any(x => x.IsAssignableFrom(source));
    }
}