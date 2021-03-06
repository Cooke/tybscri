using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using CookeRpc.AspNetCore.Model;
using CookeRpc.AspNetCore.Utils;

namespace Tybscri.TypeMapping;

public class TypeMapper
{
    private readonly List<TybscriType> types = new List<TybscriType>();
    private readonly Dictionary<Type, TybscriType> _typeMap = new Dictionary<Type, TybscriType>();
    private readonly TypeMapperOptions _options = new TypeMapperOptions();

    public TybscriType Map(Type clrType)
    {
        var knownType = _typeMap.GetValueOrDefault(clrType);
        if (knownType != null) {
            return knownType;
        }

        if (clrType.IsClass) {
            var objectType = DefineObject(clrType);
            Add(clrType, objectType);
            return objectType;
        }

        throw new InvalidOperationException($"The CLR type {clrType} cannot automatically be mapped to a tybscri type");
    }

    public void Add(Type clrType, TybscriType tybscriType)
    {
        if (_typeMap.TryGetValue(clrType, out var alreadyMapped)) {
            if (tybscriType != alreadyMapped) {
                throw new ArgumentException("CLR type already mapped to a different tybscri type", nameof(tybscriType));
            }

            return;
        }

        _typeMap.Add(clrType, tybscriType);
    }

    private TybscriType DefineObject(Type type)
    {
        var props = new List<TybscriMember>();
        var typeName = _options.TypeNameFormatter(type);
        TybscriType tybscriType = new ObjectType(type, new Lazy<IReadOnlyCollection<TybscriMember>>(() => props));

        props.AddRange(CreateMemberDefinitions(type).OrderBy(x => x.Name));
        return tybscriType;
    }

    // private RpcType DefineUnion(Type type)
    // {
    //     var memberTypes = new List<RpcType>();
    //     var name = _options.TypeNameFormatter(type);
    //     var typeDefinition = new RpcUnionDefinition(name, type, memberTypes);
    //     var customType = AddTypeDefinition(typeDefinition);
    //     memberTypes.AddRange(ReflectionHelper.FindAllOfType(type).Except(new[] { type }).Where(_options.TypeFilter)
    //         .Select(MapType));
    //     return customType;
    // }
    //
    // private RpcType DefineEnum(Type type)
    // {
    //     var typeDefinition = new RpcEnumDefinition(_options.TypeNameFormatter(type), type,
    //         Enum.GetNames(type).Zip(Enum.GetValues(type).Cast<int>(),
    //             (name, val) => new RpcEnumMember(_options.EnumMemberNameFormatter(name), val)).ToList());
    //     return AddTypeDefinition(typeDefinition);
    // }
    //
    private IEnumerable<TybscriMember> CreateMemberDefinitions(Type type)
    {
        var memberInfos = type.GetMembers(_options.MemberBindingFilter).Where(_options.MemberFilter);

        var props = new List<TybscriMember>();

        TybscriMember CreatePropertyMember(Type propertyInfoPropertyType1, MemberInfo memberInfo)
        {
            var propTypeRef = Map(propertyInfoPropertyType1);
            var propertyDefinition = new TybscriMember(_options.MemberNameFormatter(memberInfo),
                // _options.IsMemberNullable(memberInfo)
                //     ? new RpcUnionType(new[] { PrimitiveTypes.Null, propTypeRef })
                //    : 
                propTypeRef, memberInfo);
            return propertyDefinition;
        }

        foreach (var memberInfo in memberInfos) {
            switch (memberInfo) {
                case FieldInfo fieldInfo when _options.TypeFilter(fieldInfo.FieldType):
                {
                    var propertyInfoPropertyType = fieldInfo.FieldType;
                    var tsProperty = CreatePropertyMember(propertyInfoPropertyType, fieldInfo);
                    props.Add(tsProperty);
                    break;
                }

                case PropertyInfo propertyInfo when _options.TypeFilter(propertyInfo.PropertyType):
                {
                    var propertyInfoPropertyType = propertyInfo.PropertyType;
                    var tsProperty = CreatePropertyMember(propertyInfoPropertyType, propertyInfo);
                    props.Add(tsProperty);
                    break;
                }

                case MethodInfo methodInfo:
                {
                    var returnType = Map(methodInfo.ReturnType);
                    var parameters = methodInfo.GetParameters()
                        .Select((p, i) => new FuncParameter(p.Name ?? $"arg{i}", Map(p.ParameterType)));
                    props.Add(new TybscriMember(methodInfo.Name, new FuncType(returnType, parameters), memberInfo));
                    break;
                }
            }
        }

        return props;
    }
}