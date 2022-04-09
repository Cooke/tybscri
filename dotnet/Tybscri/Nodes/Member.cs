using System.Linq.Expressions;
using System.Reflection;

namespace Tybscri.Nodes;

public class MemberNode : Node
{
    private TybscriMember? _member;

    public Node Expression { get; }

    public Token MemberName { get; }

    public MemberNode(Node expression, Token memberName) : base(expression)
    {
        Expression = expression;
        MemberName = memberName;
    }

    public override void ResolveTypes(CompileContext context, AnalyzeContext analyzeContext)
    {
        Expression.ResolveTypes(context, analyzeContext);

        if (Expression.ValueType is null) {
            // An error should be reported elsewhere
            return;
        }

        var matchingMembers = Expression.ValueType.FindMembersByName(MemberName.Text);
        if (matchingMembers.Count == 0) {
            return;
        }

        if (matchingMembers.Count > 1) {
            return;
        }

        _member = matchingMembers.First();
        ValueType = _member.Type;
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        if (_member is null) {
            throw new InvalidOperationException("Unknown member");
        }

        var memberExpression = System.Linq.Expressions.Expression.Property(Expression.ToClrExpression(generateContext),
            (PropertyInfo)_member.MemberInfo);

        // if (memberExpression.Type.IsAssignableTo(_member.Type.ClrType)) {
        //     return memberExpression;
        // }
        
        return System.Linq.Expressions.Expression.Convert(memberExpression, _member.Type.ClrType);
    }
}