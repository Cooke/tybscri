using System.Linq.Expressions;
using Tybscri.Common;

namespace Tybscri;

public class FuncType : TybscriType
{
    private readonly Lazy<IReadOnlyList<FuncParameter>> _lazyParameters;
    private readonly Lazy<Type> _lazyClrType;

    public TybscriType ReturnType { get; }

    public override Type ClrType => _lazyClrType.Value;

    public IReadOnlyList<FuncParameter> Parameters => _lazyParameters.Value;

    public FuncType(TybscriType returnType, IReadOnlyList<FuncParameter> parameters) : this(returnType,
        () => parameters)
    {
    }

    public FuncType(TybscriType returnType, Func<IReadOnlyList<FuncParameter>> parametersThunk)
    {
        ReturnType = returnType;
        _lazyParameters = new Lazy<IReadOnlyList<FuncParameter>>(parametersThunk);
        _lazyClrType = new Lazy<Type>(() =>
            Expression.GetDelegateType(Parameters.Select(x => x.Type.ClrType).Concat(new[] { ReturnType.ClrType })
                .ToArray()));
    }

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return ArraySegment<TybscriMember>.Empty;
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return false;
    }

    public override TResult Visit<TResult>(TybscriTypeVisitor<TResult> visitor)
    {
        return visitor.VisitFunc(this);
    }
}