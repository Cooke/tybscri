using Tybscri.Utils;

namespace Tybscri;

public abstract class TybscriType
{
    public abstract Type ClrType { get; }

    public abstract IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName);

    public abstract bool IsAssignableFrom(TybscriType source);

    public virtual TybscriType AssignTypes(IEnumerable<TypeAssignment> typeAssignments) => this;

    public abstract TResult Visit<TResult>(TybscriTypeVisitor<TResult> visitor);

    private bool Equals(TybscriType other) => other.IsAssignableFrom(this) && IsAssignableFrom(other);

    public override bool Equals(object? obj)
    {
        if (ReferenceEquals(null, obj)) return false;
        if (ReferenceEquals(this, obj)) return true;
        if (obj.GetType() != this.GetType()) return false;
        return Equals((TybscriType)obj);
    }

    public static bool operator ==(TybscriType? left, TybscriType? right)
    {
        return Equals(left, right);
    }

    public static bool operator !=(TybscriType? left, TybscriType? right)
    {
        return !Equals(left, right);
    }

    public override int GetHashCode()
    {
        // ToString should be implemented in resp type (in the future)
        return ToString()!.GetHashCode();
    }
}