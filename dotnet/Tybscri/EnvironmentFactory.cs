using System.Linq.Expressions;
using System.Reflection;
using CookeRpc.AspNetCore.Model;
using Tybscri.Common;
using Tybscri.LinqExpressions;
using Tybscri.TypeMapping;

namespace Tybscri;

public partial record Environment
{
    public static Environment Create(Type globalsType)
    {
        var mapperOptions = new TypeMapperOptions();
        var typeMapper = new TypeMapper(Standard.TypeMappings.Mappings, mapperOptions);

        var globalsExpression = Expression.Parameter(globalsType);
        var globalSymbols = new List<EnvironmentSymbol>();

        foreach (var memberInfo in globalsType.GetMembers()) {
            var symbol = MapMember(memberInfo);
            if (symbol != null) {
                globalSymbols.Add(symbol);
            }
        }

        var symbols = typeMapper.Definitions.Select(x => new EnvironmentSymbol(x.Name, x)).Concat(globalSymbols)
            .ToList();

        return new Environment(symbols, StandardTypes.ListDefinition, StandardTypes.BooleanDefinition,
            globalsExpression, typeMapper.ToTypeMappings());

        EnvironmentSymbol? MapMember(MemberInfo memberInfo)
        {
            var symbolName = mapperOptions.MemberNameFormatter(memberInfo);

            if (!(memberInfo != typeof(IEquatable<>).MakeGenericType(globalsType)
                      .GetMember(nameof(IEquatable<object>.Equals)).First() &&
                  memberInfo.DeclaringType != typeof(object))) {
                return null;
            }

            return memberInfo switch
            {
                FieldInfo fieldInfo => new EnvironmentSymbol(symbolName, typeMapper.Map(fieldInfo.FieldType),
                    Expression.Field(globalsExpression, fieldInfo)),
                PropertyInfo propertyInfo => new EnvironmentSymbol(symbolName,
                    typeMapper.Map(propertyInfo.PropertyType), Expression.Property(globalsExpression, propertyInfo)),
                MethodInfo { IsSpecialName: false } methodInfo => new EnvironmentSymbol(symbolName,
                    typeMapper.MapMethodInfo(methodInfo), new TybscriMemberExpression(globalsExpression, methodInfo)),
                _ => null
            };
        }
    }
}