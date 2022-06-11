using System.Reflection;

namespace Tybscri;

public class TybscriMember
{
    public TybscriMember(string name, TybscriType type, MemberInfo memberInfo)
    {
        Name = name;
        Type = type;
        MemberInfo = memberInfo;
    }

    public TybscriType Type { get; }

    public MemberInfo MemberInfo { get; }

    public string Name { get; }

    public TybscriMember CreateMember(IEnumerable<TypeAssignment> typeAssignments)
    {
        var tybscriType = Type.CreateType(typeAssignments);
        return tybscriType == Type ? this : new TybscriMember(Name, tybscriType, MemberInfo);
    }
}