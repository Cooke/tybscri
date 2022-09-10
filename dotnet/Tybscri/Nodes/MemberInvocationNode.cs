using System.Linq.Expressions;
using System.Reflection;
using Tybscri.Common;
using Tybscri.LinqExpressions;

namespace Tybscri.Nodes;

public class MemberInvocationNode : IExpressionNode
{
    private TybscriMember? _member;

    public MemberInvocationNode(IExpressionNode instance, Token memberName, List<IExpressionNode> arguments)
    {
        Instance = instance;
        MemberName = memberName;
        Arguments = arguments;
        Children = new[] { Instance }.Concat(Arguments).ToArray();
    }

    public IExpressionNode Instance { get; }

    public Token MemberName { get; }

    public IReadOnlyCollection<IExpressionNode> Arguments { get; }

    public IReadOnlyCollection<INode> Children { get; }

    public Scope Scope { get; private set; } = Scope.Empty;

    public TybscriType ValueType { get; private set; } = UnknownType.Instance;

    public void SetupScopes(Scope scope)
    {
        foreach (var child in Children) {
            child.SetupScopes(scope);
        }

        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
        Instance.Resolve(context);

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

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        if (_member is null) {
            throw new InvalidOperationException("Unknown member");
        }

        return Expression.Call(Instance.GenerateLinqExpression(generateContext), (MethodInfo)_member.MemberInfo,
            Arguments.Select(x => x.GenerateLinqExpression(generateContext)));
    }
}