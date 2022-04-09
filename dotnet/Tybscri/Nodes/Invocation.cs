using System.Linq.Expressions;

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

    public override void ResolveTypes(CompileContext context, AnalyzeContext analyzeContext)
    {
        Target.ResolveTypes(context, analyzeContext);

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
            arg.ResolveTypes(context, analyzeContext with { ExpectedType = expectedType });

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
        return Expression.Invoke(Target.ToClrExpression(generateContext), Arguments.Select(x => x.ToClrExpression(generateContext)));
    }
}