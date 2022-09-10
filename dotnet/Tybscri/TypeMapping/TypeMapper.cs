using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using CookeRpc.AspNetCore.Model;
using CookeRpc.AspNetCore.Utils;
using Tybscri.Common;

namespace Tybscri.TypeMapping;

public class TypeMapper : ITypeMapper
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

        if (clrType == typeof(void)) {
            return StandardTypes.Void;
        }

        if (clrType.IsAssignableTo(typeof(Delegate))) {
            var funcType = DefineFuncType(clrType);
            Add(clrType, funcType);
            return funcType;
        }

        if (clrType.IsClass) {
            var objectType = DefineObject(clrType);
            Add(clrType, objectType);
            return objectType;
        }

        throw new InvalidOperationException($"The CLR type {clrType} cannot automatically be mapped to a tybscri type");
    }

    private TybscriType DefineFuncType(Type clrType)
    {
        return MapMethodInfo(clrType.GetMethod("Invoke") ??
                              throw new InvalidOperationException(
                                  $"CLR type {clrType} cannot be mapped to a tybscri func type"));
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
        var typeName = _options.TypeNameFormatter(type);
        return new ObjectType(type,
            new Lazy<IReadOnlyCollection<TybscriMember>>(() =>
                CreateMemberDefinitions(type).OrderBy(x => x.Name).ToList()));
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

        foreach (var memberInfo in memberInfos) {
            switch (memberInfo) {
                case FieldInfo fieldInfo when _options.TypeFilter(fieldInfo.FieldType):
                {
                    props.Add(CreateMember(Map(fieldInfo.FieldType), fieldInfo));
                    break;
                }

                case PropertyInfo propertyInfo when _options.TypeFilter(propertyInfo.PropertyType):
                {
                    props.Add(CreateMember(Map(propertyInfo.PropertyType), propertyInfo));
                    break;
                }

                case MethodInfo methodInfo:
                {
                    props.Add(CreateMember(MapMethodInfo(methodInfo), memberInfo));
                    break;
                }
            }
        }

        return props;

        TybscriMember CreateMember(TybscriType tybscriType, MemberInfo memberInfo)
        {
            return new TybscriMember(_options.MemberNameFormatter(memberInfo),
                // _options.IsMemberNullable(memberInfo)
                //     ? new RpcUnionType(new[] { PrimitiveTypes.Null, propTypeRef })
                //    : 
                tybscriType, memberInfo);
        }
    }

    public TybscriType MapMethodInfo(MethodInfo methodInfo)
    {
        var returnType = Map(methodInfo.ReturnType);
        var parameters = methodInfo.GetParameters()
            .Select((p, i) => new FuncParameter(p.Name ?? $"arg{i}", Map(p.ParameterType)));
        var funcType = new FuncType(returnType, parameters);
        return funcType;
    }
}