using System.Linq.Expressions;
using Tybscri.Common;

namespace Tybscri;

public class FuncType : TybscriType
{
    public TybscriType ReturnType { get; }

    public override Type ClrType { get; }

    public IReadOnlyList<FuncParameter> Parameters { get; }

    public FuncType(TybscriType returnType, IEnumerable<FuncParameter> parameters)
    {
        ReturnType = returnType;
        Parameters = parameters.ToArray();
        ClrType = Expression.GetDelegateType(Parameters.Select(x => x.Type.ClrType).Concat(new[] { ReturnType.ClrType })
            .ToArray());
    }

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return ArraySegment<TybscriMember>.Empty;
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return false;
    }
}