using System.Linq.Expressions;
using Tybscri.LinqExpressions;

namespace Tybscri.Nodes;

public class InvocationNode : Node
{
    public Node Target { get; }
    public IReadOnlyList<Node> Arguments { get; }

    public InvocationNode(Node target, IReadOnlyList<Node> arguments) : base(new[] { target }.Concat(arguments)
        .ToArray())
    {
        Target = target;
        Arguments = arguments;
    }

    public override void SetupScopes(Scope scope)
    {
        Target.SetupScopes(scope);

        foreach (var arg in Arguments) {
            arg.SetupScopes(scope);
        }

        Scope = scope;
    }

    public override void ResolveTypes(AnalyzeContext context)
    {
        Target.ResolveTypes(context);

        if (Target.ValueType is not FuncType funcType) {
            throw new TybscriException("Cannot invoke value of non func type");
        }

        var args = Arguments;
        // const args  = [
        // ...this.argumentList,
        // ...(this.trailingLambda?[this.trailingLambda] : []), ]
        // ;
        for (var i = 0; i < args.Count; i++) {
            var arg = args[i];
            var parameter = funcType.Parameters.ElementAtOrDefault(i);
            var expectedType = parameter?.Type;
            arg.ResolveTypes(context with { ExpectedType = expectedType });

            if (expectedType is null || arg.ValueType is null) {
                throw new NotImplementedException("Should report error");
            }

            if (!expectedType.IsAssignableFrom(arg.ValueType)) {
            }
        }

        ValueType = funcType.ReturnType;
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        return new TybscriInvokeExpression(Target.ToClrExpression(generateContext),
            Arguments.Select(x => x.ToClrExpression(generateContext)));
    }
}