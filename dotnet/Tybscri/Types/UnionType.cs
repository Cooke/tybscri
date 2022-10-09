using System.Collections.Immutable;
using Tybscri.Common;
using Tybscri.Utils;

namespace Tybscri;

public class UnionType : TybscriType
{
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
        Types = types;
    }

    public override Type ClrType => ClrTypeUtils.FindCommonType(Types.Select(x => x.ClrType).ToArray());

    public IImmutableSet<TybscriType> Types { get; }

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        throw new NotImplementedException();
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return Types.Any(x => x.IsAssignableFrom(source));
    }

    public override TResult Visit<TResult>(TybscriTypeVisitor<TResult> visitor)
    {
        return visitor.VisitUnion(this);
    }
}