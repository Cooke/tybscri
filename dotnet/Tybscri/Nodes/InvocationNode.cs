using System.Linq.Expressions;
using System.Reflection;
using Tybscri.Common;
using Tybscri.Interpreter;
using Tybscri.LinqExpressions;

namespace Tybscri.Nodes;

public class InvocationNode : IExpressionNode, IAsyncEvaluatable
{
    public InvocationNode(IExpressionNode target, IReadOnlyList<IExpressionNode> arguments)
    {
        Target = target;
        Arguments = arguments;

        Children = new[] { target }.Concat(arguments).ToArray();
    }

    public IExpressionNode Target { get; }

    public IReadOnlyList<IExpressionNode> Arguments { get; }

    public IReadOnlyCollection<INode> Children { get; }

    public Scope Scope { get; private set; } = Scope.Empty;

    public TybscriType ValueType { get; private set; } = UnknownType.Instance;

    public void SetupScopes(Scope scope)
    {
        Target.SetupScopes(scope);

        foreach (var arg in Arguments) {
            arg.SetupScopes(scope);
        }

        Scope = scope;
    }

    public void Resolve(ResolveContext context)
    {
        Target.Resolve(context);

        if (Target.ValueType is not FuncType funcType) {
            throw new TybscriException("Cannot invoke value of non func type");
        }

        for (var i = 0; i < Arguments.Count; i++) {
            var arg = Arguments[i];
            var parameter = funcType.Parameters.ElementAtOrDefault(i);
            var expectedType = parameter?.Type;
            arg.Resolve(context with { ExpectedType = expectedType });

            if (expectedType is null || arg.ValueType is null) {
                throw new NotImplementedException("Should report error");
            }

            if (!expectedType.IsAssignableFrom(arg.ValueType)) {
            }
        }

        ValueType = funcType.ReturnType;
    }

    public Expression GenerateLinqExpression(GenerateContext generateContext)
    {
        var targetFunc = (FuncType)Target.ValueType;

        return new TybscriInvokeExpression(Target.GenerateLinqExpression(generateContext),
            Arguments.Select((x) => x.GenerateLinqExpression(generateContext)), targetFunc.Async);
    }

    public async ValueTask<object?> EvaluateAsync(EvalContext context)
    {
        var target = await ((IAsyncEvaluatable)Target).EvaluateAsync(context);
        var args = new object?[Arguments.Count];
        for (int i = 0; i < Arguments.Count; i++) {
            args[i] = await ((IAsyncEvaluatable)Arguments[i]).EvaluateAsync(context);
        }

        var result = ((Delegate)target!).DynamicInvoke(args);

        // Handle async methods - await the Task if needed
        if (result is Task task) {
            await task;
            var taskType = task.GetType();
            if (taskType.IsGenericType) {
                var resultProperty = taskType.GetProperty("Result");
                return resultProperty?.GetValue(task);
            }
            return null;
        }

        return result;
    }
}