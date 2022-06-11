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
    
    public override void SetupScopes(Scope scope)
    {
        foreach (var child in Children) {
            child.SetupScopes(scope);
        }

        Scope = scope;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        Instance.ResolveTypes(context);

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

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        if (_member is null) {
            throw new InvalidOperationException("Unknown member");
        }

        return Expression.Call(Instance.ToClrExpression(generateContext), (MethodInfo)_member.MemberInfo,
            Arguments.Select(x => x.ToClrExpression(generateContext)));
    }
}