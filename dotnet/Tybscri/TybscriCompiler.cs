using System.Linq.Expressions;
using Tybscri.Common;
using Tybscri.LinqExpressions;
using Tybscri.Symbols;
using Tybscri.TypeMapping;

namespace Tybscri;

public class TybscriCompiler
{
    private static readonly object EmptyEnvironment = new object();

    private readonly Func<ITypeMapper> _typeMapperFactory;

    private readonly IReadOnlyCollection<DefinitionType> _defaultTypes = new DefinitionType[]
    {
        StandardTypes.List, StandardTypes.NumberDefinition, StandardTypes.BooleanDefinition,
        StandardTypes.NullDefinition, StandardTypes.StringDefinition, StandardTypes.VoidDefinition,
        StandardTypes.NeverDefinition
    };


    public TybscriCompiler(Func<ITypeMapper> typeMapperFactory)
    {
        _typeMapperFactory = typeMapperFactory;
    }

    public TybscriCompiler()
    {
        _typeMapperFactory = () => new TypeMapper(new Dictionary<object, TybscriType>
        {
            { typeof(double), StandardTypes.Number },
            { typeof(int), StandardTypes.Number },
            { typeof(bool), StandardTypes.Boolean },
            { typeof(string), StandardTypes.String }
        });
    }

    public Func<TEnvironment, TResult> CompileExpression<TResult, TEnvironment>(string expression)
        where TEnvironment : class
    {
        var typeMapper = CreateTypeMapper();
        return CompileExpression<TResult, TEnvironment>(expression, typeMapper.Map(typeof(TResult)), typeMapper);
    }


    public Func<TEnvironment, TResult> CompileExpression<TResult, TEnvironment>(string expression,
        TybscriType expectedResultType,
        ITypeMapper typeMapper) where TEnvironment : class
    {
        var parser = new TybscriParser(expression);
        var expressionNode = parser.ParseExpression();
        if (!parser.EndOfScript) {
            throw new TybscriException("Could not parse full text as one expression");
        }

        var env = CreateEnvironment<TEnvironment>(typeMapper);
        var scope = new Scope(env.Symbols.Select(x => new ExternalSymbol(x.Expression, x.Type, x.Name)));

        expressionNode.SetupScopes(scope);
        expressionNode.Resolve(new ResolveContext(expectedResultType));

        var clrExpression = expressionNode.GenerateLinqExpression(new GenerateContext(Expression.Label()));
        var lambda = Expression.Lambda<Func<TEnvironment, TResult>>(clrExpression, env.Expression);
        return lambda.Compile();
    }

    private Environment CreateEnvironment<TEnvironment>(ITypeMapper typeMapper) where TEnvironment : class
    {
        var envExpression = Expression.Parameter(typeof(TEnvironment));
        var envSymbols = CreateEnvironmentSymbols<TEnvironment>(envExpression, typeMapper);
        var typeSymbols = _defaultTypes.Concat(typeMapper.Definitions).Select(x =>
            new EnvironmentSymbol(x.Name, x, Expression.Constant(null, typeof(object))));
        return new Environment(typeSymbols.Concat(envSymbols).ToArray(), typeMapper.CollectionDefinition,
            envExpression);
    }

    public Func<TResult> CompileExpression<TResult>(string script)
    {
        var mapper = CreateTypeMapper();
        var expectedType = mapper.Map(typeof(TResult));
        var expression = CompileExpression<TResult, object>(script, expectedType, mapper);
        return () => expression(EmptyEnvironment);
    }

    public TResult EvaluateExpression<TResult>(string script, TybscriType expectedResultType)
    {
        var func = CompileExpression<TResult, object>(script, expectedResultType, CreateTypeMapper());
        return func(EmptyEnvironment);
    }

    public TResult EvaluateExpression<TResult>(string script)
    {
        var func = CompileExpression<TResult>(script);
        return func();
    }

    public TResult EvaluateExpression<TResult, TEnvironment>(string script, TEnvironment environment)
        where TEnvironment : class
    {
        var func = CompileExpression<TResult, TEnvironment>(script);
        return func(environment);
    }

    public Func<TEnvironment, TResult> CompileScript<TResult, TEnvironment>(string script) where TEnvironment : class
    {
        var mapper = CreateTypeMapper();
        return Compile<Func<TEnvironment, TResult>, TEnvironment>(script, mapper.Map(typeof(TResult)), mapper);
    }

    public Func<TResult> CompileScript<TResult>(string script)
    {
        var compile = CompileScript<TResult, object>(script);
        return () => compile(EmptyEnvironment);
    }

    public void EvaluateScript(string script)
    {
        var func = Compile<Action<object>, object>(script, StandardTypes.Void, CreateTypeMapper());
        func(new object());
    }

    public TResult EvaluateScript<TResult>(string script)
    {
        var func = CompileScript<TResult>(script);
        return func();
    }

    public void EvaluateScript<TEnvironment>(string script, TEnvironment environment) where TEnvironment : class
    {
        var func = Compile<Action<TEnvironment>, TEnvironment>(script, StandardTypes.Void, CreateTypeMapper());
        func(environment);
    }

    public TResult EvaluateScript<TResult, TEnvironment>(string script, TEnvironment environment)
        where TEnvironment : class
    {
        var func = CompileScript<TResult, TEnvironment>(script);
        return func(environment);
    }

    private IEnumerable<EnvironmentSymbol> CreateEnvironmentSymbols<TEnvironment>(ParameterExpression envExpression,
        ITypeMapper typeMapper) where TEnvironment : class
    {
        foreach (var envTypeMember in typeMapper.MapMembers(typeof(TEnvironment))) {
            var getter = new TybscriMemberExpression(envExpression, envTypeMember.MemberInfo);
            yield return new EnvironmentSymbol(envTypeMember.Name, envTypeMember.Type, getter);
        }
    }

    private TDelegate Compile<TDelegate, TEnvironment>(string script, TybscriType expectedType, ITypeMapper typeMapper)
        where TEnvironment : class
    {
        var parser = new TybscriParser(script);
        var scriptNode = parser.ParseScript();

        var envExpression = Expression.Parameter(typeof(TEnvironment), "environment");
        var envSymbols = CreateEnvironmentSymbols<TEnvironment>(envExpression, typeMapper);
        var typeSymbols = typeMapper.Definitions.Concat(_defaultTypes).Select(x =>
            new EnvironmentSymbol(x.Name, x, Expression.Constant(null, typeof(object))));
        var scope = new Scope(envSymbols.Concat(typeSymbols)
            .Select(x => new ExternalSymbol(x.Expression, x.Type, x.Name)));
        scriptNode.SetupScopes(scope);
        scriptNode.Resolve(new ResolveContext(expectedType));
        var clrExpression = scriptNode.GenerateLinqExpression(new GenerateContext(Expression.Label()));
        return Expression.Lambda<TDelegate>(clrExpression, envExpression).Compile();
    }

    public TybscriType EvaluateType(string type)
    {
        var parser = new TybscriParser(type);
        var typeNode = parser.ParseType();
        if (!parser.EndOfScript) {
            throw new TybscriException("Could not parse full text as a type");
        }

        var scope = new Scope(_defaultTypes.Select(x =>
            new ExternalSymbol(Expression.Constant(null, typeof(Object)), x, x.Name)));
        typeNode.SetupScopes(scope);
        typeNode.Resolve(new ResolveContext(null));
        return typeNode.Type;
    }

    private ITypeMapper CreateTypeMapper()
    {
        return _typeMapperFactory();
    }

    public Environment CreateEnvironment<TEnvironment>() where TEnvironment : class
    {
        return CreateEnvironment<TEnvironment>(CreateTypeMapper());
    }
}