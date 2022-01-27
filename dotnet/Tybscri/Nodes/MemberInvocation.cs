using System.Linq.Expressions;
using System.Reflection;
using Tybscri.LinqExpressions;

namespace Tybscri.Nodes;

public class MemberInvocation : Node
{
    private TybscriMember? _member;

    public Node Instance { get; }

    public Token MemberName { get; }

    public IReadOnlyCollection<Node> Arguments { get; }

    public MemberInvocation(Node instance, Token memberName, List<Node> arguments) : base(instance)
    {
        Instance = instance;
        MemberName = memberName;
        Arguments = arguments;
    }

    public override void ResolveTypes(CompileContext context, TybscriType? expectedType = null)
    {
        Instance.ResolveTypes(context, null);

        if (Instance.ValueType is null) {
            // An error should be reported elsewhere
            return;
        }

        var matchingMembers = Instance.ValueType.FindMembersByName(MemberName.Text);
        if (matchingMembers.Count == 0) {
            return;
        }

        if (matchingMembers.Count > 1) {
            return;
        }

        _member = matchingMembers.First();
        ValueType = _member.Type;
    }

    public override Expression ToClrExpression()
    {
        if (_member is null) {
            throw new InvalidOperationException("Unknown member");
        }

        return Expression.Call(Instance.ToClrExpression(), (MethodInfo)_member.MemberInfo,
            Arguments.Select(x => x.ToClrExpression()));
    }
}