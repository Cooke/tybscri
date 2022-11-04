using System.Reflection;
using CookeRpc.AspNetCore.Model;
using CookeRpc.AspNetCore.Utils;
using Tybscri.Common;

namespace Tybscri.TypeMapping;

public interface ITypeMapper
{
    TybscriType Map(Type clrType);

    TybscriType MapMethodInfo(MethodInfo methodInfo);

    IEnumerable<TybscriMember> MapMembers(Type type);

    IReadOnlyCollection<ObjectDefinitionType> Definitions { get; }
    
    ObjectDefinitionType CollectionDefinition { get; }
}

public class TypeMapper : ITypeMapper
{
    private readonly Dictionary<object, TybscriType> _mappings;
    private readonly TypeMapperOptions _options = new TypeMapperOptions();
    private readonly List<ObjectDefinitionType> _definitions = new();

    public TypeMapper(IReadOnlyDictionary<object, TybscriType> initialMappings)
    {
        _mappings = initialMappings.ToDictionary(x => x.Key, x => x.Value);
    }

    public IReadOnlyCollection<ObjectDefinitionType> Definitions => _definitions;

    public ObjectDefinitionType CollectionDefinition => StandardTypes.List;

    public TybscriType Map(Type clrType)
    {
        var mappedType = _mappings.GetValueOrDefault(clrType);
        if (mappedType != null) {
            return mappedType;
        }

        if (clrType == typeof(void)) {
            return StandardTypes.Void;
        }

        var genericClrList = ReflectionHelper.GetGenericTypeOfDefinition(clrType, typeof(IList<>));
        if (genericClrList != null) {
            var clrItemType = genericClrList.GenericTypeArguments[0];
            var itemType = Map(clrItemType);
            return StandardTypes.List.CreateType(itemType);
        }

        if (clrType.IsAssignableTo(typeof(Delegate))) {
            return MapFuncType(clrType);
        }

        if (clrType.IsClass) {
            return MapObject(clrType);
        }

        throw new InvalidOperationException($"The CLR type {clrType} cannot automatically be mapped to a tybscri type");
    }

    private TybscriType MapFuncType(Type clrType)
    {
        return MapMethodInfo(clrType.GetMethod("Invoke") ??
                             throw new InvalidOperationException(
                                 $"CLR type {clrType} cannot be mapped to a tybscri func type"));
    }

    private ObjectType MapObject(Type type)
    {
        var typeName = _options.TypeNameFormatter(type);
        var members = new List<TybscriMember>();
        var objectDefinitionType = new ObjectDefinitionType(typeName, type, ArraySegment<TypeParameter>.Empty,
            new Lazy<IReadOnlyCollection<TybscriMember>>(() => members));
        var objectType = objectDefinitionType.CreateType();
        Add(type, objectType);
        members.AddRange(MapMembers(type).OrderBy(x => x.Name));
        return objectType;
    }

    public IEnumerable<TybscriMember> MapMembers(Type type)
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
        var mappedType = _mappings.GetValueOrDefault(methodInfo);
        if (mappedType != null) {
            return mappedType;
        }

        var async = methodInfo.ReturnType.IsAssignableTo(typeof(Task));
        var clrReturnType = async ? methodInfo.ReturnType.GetTaskType()! : methodInfo.ReturnType;
        var returnType = Map(clrReturnType);
        
        var parameters = new List<FuncParameter>();
        var funcType = new FuncType(returnType, () => parameters, async);
        Add(methodInfo, funcType);
        parameters.AddRange(methodInfo.GetParameters()
            .Select((p, i) => new FuncParameter(p.Name ?? $"arg{i}", Map(p.ParameterType))));
        return funcType;
    }

    private void Add(Object clrTypeOrMethodInfo, TybscriType tybscriType)
    {
        if (_mappings.TryGetValue(clrTypeOrMethodInfo, out var alreadyMapped)) {
            if (tybscriType != alreadyMapped) {
                throw new ArgumentException("CLR type already mapped to a different tybscri type", nameof(tybscriType));
            }

            return;
        }

        if (tybscriType is ObjectType objectType) {
            _definitions.Add(objectType.Definition);
        }

        _mappings.Add(clrTypeOrMethodInfo, tybscriType);
    }
}