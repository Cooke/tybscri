using System.Linq.Expressions;
using System.Reflection;
using Tybscri.Common;
using Tybscri.Interpreter;

namespace Tybscri.Nodes;

public class MemberAccessNode : IExpressionNode, IAsyncEvaluatable
{
    public MemberAccessNode(IExpressionNode instance, Token memberName)
    {
        Instance = instance;
        MemberName = memberName;
        Children = new[] { Instance };
    }

    private TybscriMember? _member;

    public IExpressionNode Instance { get; }

    public Token MemberName { get; }

    public IReadOnlyCollection<INode> Children { get; }

    public Scope Scope { get; private set; } = Scope.Empty;

    public TybscriType ValueType { get; private set; } = UnknownType.Instance;

    public void SetupScopes(Scope scope)
    {
        Instance.SetupScopes(scope);
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

        var memberExpression = System.Linq.Expressions.Expression.Property(Instance.GenerateLinqExpression(generateContext),
            (PropertyInfo)_member.MemberInfo);

        // if (memberExpression.Type.IsAssignableTo(_member.Type.ClrType)) {
        //     return memberExpression;
        // }

        return Expression.Convert(memberExpression, _member.Type.ClrType);
    }

    public async ValueTask<object?> EvaluateAsync(EvalContext context)
    {
        if (_member is null) {
            throw new InvalidOperationException("Unknown member");
        }

        var instance = await ((IAsyncEvaluatable)Instance).EvaluateAsync(context);

        return _member.MemberInfo switch
        {
            PropertyInfo pi => pi.GetValue(instance),
            FieldInfo fi => fi.GetValue(instance),
            _ => throw new InvalidOperationException("Cannot access non-property/field member")
        };
    }
}