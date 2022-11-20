using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using DotNext.Linq.Expressions;
using DotNext.Metaprogramming;

using Xunit;
using static DotNext.Metaprogramming.CodeGenerator;
using Assert = Xunit.Assert;

namespace Tybscri.Test;

public class AsyncFunctionTests
{
    private readonly TybscriCompiler _compiler;

    public AsyncFunctionTests()
    {
        _compiler = new TybscriCompiler();
    }

    [Fact]
    public void ClosureIssue()
    {
        var lambda = AsyncLambda<Func<Task<string>>>(_ =>
        {
            var hello = DeclareVariable<string>("hello");
            var foo = DeclareVariable<Func<string>>("foo");
            Statement(Expression.Assign(hello, Expression.Constant("hello")));
            Statement(Expression.Assign(foo, Expression.Lambda<Func<string>>(hello)));
            CodeGenerator.Return(Expression.Invoke(foo));
        });

        var compiled = lambda.Compile();

        Assert.Equal("hello", compiled.Invoke().Result);
    }
    
    [Fact]
    public static async Task ParameterClosure()
    {
        var lambda = AsyncLambda<Func<string, Task<string>>>(ctx =>
        {
            var hello = DeclareVariable<string>("hello");
            var foo = DeclareVariable<Func<string>>("foo");
            Assign(hello, "hello".Const());
            Assign(foo, Expression.Lambda<Func<string>>(typeof(string).CallStatic(nameof(string.Concat), hello, ctx[0])));
            Return(foo.Invoke());
        });

        Assert.Equal("hello, world", await lambda.Compile().Invoke(", world"));
    }

    [Fact]
    public void ClosureIssue2()
    {
        var hello = Expression.Parameter(typeof(string), "hello");
        var foo = Expression.Parameter(typeof(Func<Task<string>>), "foo");
        var fooLambda = AsyncLambda<Func<Task<string>>>(_ => Return(hello));

        var lambda = AsyncLambda<Func<Task<string>>>(_ =>
        {
            Statement(Expression.Block(new[] { hello, foo },
                Expression.Assign(hello, Expression.Constant("hello")), Expression.Assign(foo, fooLambda),
                new AsyncResultExpression(Expression.Invoke(foo).Await(), false)));
        });

        Assert.Equal("hello", lambda.Compile().Invoke().Result);
    }

    [Fact]
    public void Playground()
    {
        var left = Expression.Parameter(typeof(Arg), "left");
        var right = Expression.Parameter(typeof(Arg), "right");
        var body = Expression.New(typeof(Arg).GetConstructors()[0],
            Expression.Add(Expression.Property(left, "Value"), Expression.Property(right, "Value")));
        var asyncLambda = AsyncLambda(Type.EmptyTypes, typeof(Arg), AsyncLambdaFlags.None,
            _ => Statement(Expression.Block(
                Expression.Call(typeof(Task), "Delay", null, 1.Const()).Await(),
                new AsyncResultExpression(body, false))));
        var invokeAsyncLambda = Expression.Invoke(asyncLambda);
        var lambda = Expression.Lambda<Func<Arg, Arg, Task<Arg>>>(invokeAsyncLambda, left, right);

        var wrapper = AsyncLambda(new[] { typeof(Arg), typeof(Arg) }, typeof(Arg), AsyncLambdaFlags.None,
            context => Statement(
                new AsyncResultExpression(Expression.Invoke(lambda, context[0], context[1]).Await(), false)));

        var add = (Func<Arg, Arg, Task<Arg>>)wrapper.Compile();
        var result = add(new Arg(1), new Arg(2)).Result;
        Assert.Equal(3, result.Value);
    }

    public record Arg(int Value);

    [Fact]
    public async Task Invoke()
    {
        var output = _compiler.EvaluateScriptAsync<string, TestEnvironment>(@"
            fun hello() {
                async()
                ""hello""
            }

            hello()
            ", new TestEnvironment());
        Assert.Equal("hello", await output);
    }

    [Fact]
    public async Task SyncInAsyncContext()
    {
        var output = _compiler.EvaluateScriptAsync<string, TestEnvironment>(@"
            fun hello() {
                ""hello""
            }

            hello()
            ", new TestEnvironment());
        Assert.Equal("hello", await output);
    }

    [Fact]
    public async Task Nesting()
    {
        var output = await _compiler.EvaluateScriptAsync<string, TestEnvironment>(@"
            fun foo() {
                fun bar() {
                    async()
                    ""hello""
                }

                bar()
            }

            foo()
            ", new TestEnvironment());
        Assert.Equal("hello", output);
    }


    [Fact]
    public async Task Hoisting()
    {
        var output = await _compiler.EvaluateScriptAsync<string, TestEnvironment>(@"
            foo()

            fun foo() {
                async()
                ""hello""
            }
            ", new TestEnvironment());
        Assert.Equal("hello", output);
    }

    [Fact]
    public async Task ImplicitReturn()
    {
        var output = await _compiler.EvaluateScriptAsync<double, TestEnvironment>(@"
            fun foo() {
                async()
                123
            }

            foo()
            ", new TestEnvironment());
        Assert.Equal(123, output);
    }

    [Fact]
    public async Task ExplicitReturn()
    {
        var output = await _compiler.EvaluateScriptAsync<double, TestEnvironment>(@"
            fun foo() {
                async()
                return 123
            }

            foo()
            ", new TestEnvironment());
        Assert.Equal(123, output);
    }

    [Fact]
    public async Task OneParameter()
    {
        var output = await _compiler.EvaluateScriptAsync<double, TestEnvironment>(@"
            fun identity(value: Number) {
                async()
                value
            }

            identity(123)
            ", new TestEnvironment());
        Assert.Equal(123, output);
    }

    [Fact]
    public async Task TwoParameters()
    {
        var output = await _compiler.EvaluateScriptAsync<double, TestEnvironment>(@"
            fun sub(val1: Number, val2: Number) {
                async()
                val1 - val2
            }

            sub(3, 1)
            ", new TestEnvironment());
        Assert.Equal(2, output);
    }

    [Fact]
    public async Task ThreeParameters()
    {
        var output = await _compiler.EvaluateScriptAsync<List<object>, TestEnvironment>(@"
            fun list3(val1: Number, val2: ""one"", val3: true) {
                async()
                [val1, val2, val3]
            }

            list3(1, ""one"", true)
            ", new TestEnvironment());
        Assert.Collection(output, x => Assert.Equal(1d, x), x => Assert.Equal("one", x), x => Assert.Equal(true, x));
    }

    [Fact]
    public async Task SeveralReturns()
    {
        var output = await _compiler.EvaluateScriptAsync<List<double>, TestEnvironment>(@"
            fun foo(cond: Number) {
                async()
                if (cond < 10) {
                    return 1
                }

                if (cond < 100) {
                    return 2
                }

                return 3
            }

            [foo(1), foo(10), foo(100)]
            ", new TestEnvironment());
        Assert.Collection(output, x => Assert.Equal(1, x), x => Assert.Equal(2, x), x => Assert.Equal(3, x));
    }

    [Fact]
    public async Task NestingWithHoisting()
    {
        var output = await _compiler.EvaluateScriptAsync<double, TestEnvironment>(@"
            foo()

            fun foo() {
                bar()

                fun bar() {
                    async()
                    123
                }
            }
            ", new TestEnvironment());
        Assert.Equal(123, output);
    }

    [Fact]
    public async Task NestingWithReturnWithHoisting()
    {
        var output = await _compiler.EvaluateScriptAsync<double, TestEnvironment>(@"
            foo()

            fun foo() {
                return bar()

                fun bar() {
                    async()
                    return 123
                }
            }
            ", new TestEnvironment());
        Assert.Equal(123, output);
    }

    [Fact]
    public async Task UninitializedVariable()
    {
        await Assert.ThrowsAsync<TybscriException>(async () =>
            await _compiler.EvaluateScriptAsync<string, TestEnvironment>(@"
            var result = foo()
            var hello = ""hello""
            result

            fun foo() {
                async()
                hello
            }
            ", new TestEnvironment()));
    }

    [Fact]
    public async Task Closure()
    {
        var output = await _compiler.EvaluateScriptAsync<string, TestEnvironment>(@"
            var hello = ""hello""
            foo()

            fun foo() {
                hello
            }
            ", new TestEnvironment());
        Assert.Equal("hello", output);
    }

    private class TestEnvironment
    {
        public bool DidEval;

        // ReSharper disable once UnusedMember.Local
        public void Eval(Func<bool> func)
        {
            DidEval = true;
            func();
        }

        public Task Async()
        {
            return Task.CompletedTask;
        }
    }
}