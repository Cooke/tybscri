using System.Linq.Expressions;
using Tybscri.LinqExpressions;

namespace Tybscri.Nodes;

public class Invocation : Node
{
    public Node Target { get; }
    public IReadOnlyList<Node> Arguments { get; }

    public Invocation(Node target,
        IReadOnlyList<Node> arguments
        // LambdaLiteralNode? trailingLambda = null
    ) : base(new[] { target }.Concat(arguments).ToArray())
    {
        Target = target;
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
        Target.ResolveTypes(context);

        if (Target.ValueType is not FuncType funcType) {
            // context.onDiagnosticMessage?.({
            //     message: `The expression cannot be invoked`,
            //     severity:
            //     DiagnosticSeverity.Error,
            //     span:
            //     this.target.span,
            // });
            return;
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
                // context.onDiagnosticMessage?.({
                //     message: `Argument of type '${
                //         getTypeDisplayName(arg.valueType)
                //     }
                //     ' is not assignable to '${
                //         getTypeDisplayName(expectedType)
                //     }
                //     '`,
                //     severity:
                //     DiagnosticSeverity.Error,
                //     span:
                //     arg.span,
                // });
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