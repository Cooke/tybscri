using Tybscri.Utils;

namespace Tybscri;

public abstract class TybscriType
{
    public abstract Type ClrType { get; }

    public abstract IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName);

    public abstract bool IsAssignableFrom(TybscriType source);

    public virtual TybscriType CreateType(IEnumerable<TypeAssignment> typeAssignments)
    {
        return this;
    }
}