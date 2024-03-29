﻿namespace Tybscri;

public class VoidType : TybscriType
{
    public static readonly VoidType Instance = new VoidType();

    private VoidType()
    {
    }

    public override Type ClrType => typeof(void);

    public override IReadOnlyCollection<TybscriMember> FindMembersByName(string memberName)
    {
        return ArraySegment<TybscriMember>.Empty;
    }

    public override bool IsAssignableFrom(TybscriType source)
    {
        return source.Equals(this);
    }

    public override TResult Visit<TResult>(TybscriTypeVisitor<TResult> visitor)
    {
        return visitor.VisitVoid(this);
    }
}