﻿using System.Linq.Expressions;
using System.Reflection;
using Antlr4.Runtime;
using Tybscri.LinqExpressions;
using Tybscri.Nodes;
using Tybscri.TypeMapping;

namespace Tybscri;

public class TybscriCompiler
{
    private static readonly object EmptyEnvironment = new object();
    
    private readonly ITypeMapper _typeMapper;
    private readonly Scope _baseScope;

    public TybscriCompiler(ITypeMapper typeMapper, Scope baseScope)
    {
        _typeMapper = typeMapper;
        _baseScope = baseScope;
    }

    public TybscriCompiler()
    {
        var typeMapper = new TypeMapper();
        typeMapper.Add(typeof(int), StandardTypes.Number);
        typeMapper.Add(typeof(double), StandardTypes.Number);
        typeMapper.Add(typeof(bool), StandardTypes.Boolean);
        typeMapper.Add(typeof(string), StandardTypes.String);
        _typeMapper = typeMapper;

        _baseScope = new Scope(new[]
        {
            new ExternalTypeSymbol(StandardTypes.Number, "number", _typeMapper.Map(typeof(TybscriType)))
        });
    }

    public Func<TEnvironment, TResult> CompileExpression<TResult, TEnvironment>(string expression)
        where TEnvironment : class
    {
        return CompileExpression<TResult, TEnvironment>(expression, _typeMapper.Map(typeof(TResult)));
    }

    public Func<TEnvironment, TResult> CompileExpression<TResult, TEnvironment>(string expression,
        TybscriType expectedResultType) where TEnvironment : class
    {
        var parser = new TybscriParser(expression);
        var expressionNode = parser.ParseExpression();
        if (!parser.EndOfScript) {
            throw new TybscriException("Could not parse full text as one expression");
        }

        var envExpression = Expression.Parameter(typeof(TEnvironment), "environment");
        var scope = _baseScope.CreateChildScope(GetEnvironmentSymbols<TEnvironment>(envExpression));
        expressionNode.SetupScopes(scope);
        expressionNode.ResolveTypes(new AnalyzeContext(expectedResultType));

        var clrExpression = expressionNode.ToClrExpression(new GenerateContext(Expression.Label()));
        var lambda = Expression.Lambda<Func<TEnvironment, TResult>>(clrExpression, envExpression);
        return lambda.Compile();
    }

    public Func<TResult> CompileExpression<TResult>(string script)
    {
        var expression = CompileExpression<TResult, object>(script, _typeMapper.Map(typeof(TResult)));
        return () => expression(EmptyEnvironment);
    }

    public TResult EvaluateExpression<TResult>(string script, TybscriType expectedResultType)
    {
        var func = CompileExpression<TResult, object>(script, expectedResultType);
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
        var parser = new TybscriParser(script);
        var scriptNode = parser.ParseScript();

        var envExpression = Expression.Parameter(typeof(TEnvironment), "environment");
        var scope = _baseScope.CreateChildScope(GetEnvironmentSymbols<TEnvironment>(envExpression));
        var expectedType = _typeMapper.Map(typeof(TResult));
        scriptNode.SetupScopes(scope);
        scriptNode.ResolveTypes(new AnalyzeContext(expectedType));
        var clrExpression = scriptNode.ToClrExpression(new GenerateContext(Expression.Label()));
        return Expression.Lambda<Func<TEnvironment, TResult>>(clrExpression, envExpression).Compile();
    }

    public Func<TResult> CompileScript<TResult>(string script)
    {
        var compile = CompileScript<TResult, object>(script);
        return () => compile(EmptyEnvironment);
    }

    public void EvaluateScript(string script)
    {
        var func = CompileScript<object>(script);
        func();
    }

    public TResult EvaluateScript<TResult>(string script)
    {
        var func = CompileScript<TResult>(script);
        return func();
    }

    public void EvaluateScript<TEnvironment>(string script, TEnvironment environment) where TEnvironment : class
    {
        var func = CompileScript<object, TEnvironment>(script);
        func(environment);
    }

    public TResult EvaluateScript<TResult, TEnvironment>(string script, TEnvironment environment) where TEnvironment : class
    {
        var func = CompileScript<TResult, TEnvironment>(script);
        return func(environment);
    }

    private IEnumerable<ExternalSymbol> GetEnvironmentSymbols<TEnvironment>(ParameterExpression envExpression)
        where TEnvironment : class
    {
        var envType = (ObjectType)_typeMapper.Map(typeof(TEnvironment));
        foreach (var envTypeMember in envType.Members) {
            var getter = new TybscriMemberExpression(envExpression, envTypeMember.MemberInfo);
            yield return new ExternalSymbol(getter, envTypeMember.Type, envTypeMember.Name);
        }
    }
}