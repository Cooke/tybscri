using System.Reflection;
using CookeRpc.AspNetCore.Model;
using CookeRpc.AspNetCore.Utils;
using Tybscri.Common;

namespace Tybscri.TypeMapping;

public interface ITypeMapper
{
    TybscriType Map(Type clrType);

    IReadOnlyCollection<DefinitionType> Definitions { get; }
}

public record TypeMappings(IReadOnlyDictionary<Type, DefinitionType> Mappings)
{
    public TybscriType Map(Type clrType)
    {
        var mappedType = Mappings.GetValueOrDefault(clrType);
        if (mappedType != null) {
            return mappedType.CreateType();
        }

        // TODO make generic for all types
        var genericClrList = ReflectionHelper.GetGenericTypeOfDefinition(clrType, typeof(IList<>));
        if (genericClrList != null) {
            var clrItemType = genericClrList.GenericTypeArguments[0];
            var itemType = Map(clrItemType);
            return Mappings[typeof(List<>)].CreateType(itemType);
        }

        if (clrType.IsAssignableTo(typeof(Delegate))) {
            return MapFuncType(clrType);
        }

        throw new InvalidOperationException($"The CLR type {clrType} cannot automatically be mapped to a tybscri type");
    }

    private TybscriType MapFuncType(Type clrType)
    {
        return MapMethodInfo(clrType.GetMethod("Invoke") ??
                             throw new InvalidOperationException(
                                 $"CLR type {clrType} cannot be mapped to a tybscri func type"));
    }

    private TybscriType MapMethodInfo(MethodInfo methodInfo)
    {
        var async = methodInfo.ReturnType.IsAssignableTo(typeof(Task));
        var clrReturnType = async ? methodInfo.ReturnType.GetTaskType()! : methodInfo.ReturnType;
        var returnType = Map(clrReturnType);

        var parameters = new List<FuncParameter>();
        var funcType = new FuncType(returnType, () => parameters, async);
        parameters.AddRange(methodInfo.GetParameters()
            .Select((p, i) => new FuncParameter(p.Name ?? $"arg{i}", Map(p.ParameterType))));
        return funcType;
    }
}

public class TypeMapper : ITypeMapper
{
    private readonly Dictionary<Type, DefinitionType> _mappings;
    private readonly TypeMapperOptions _options;

    public TypeMapper(IReadOnlyDictionary<Type, DefinitionType> initialMappings, TypeMapperOptions options)
    {
        _options = options;
        _mappings = initialMappings.ToDictionary(x => x.Key, x => x.Value);
    }

    public IReadOnlyCollection<DefinitionType> Definitions => _mappings.Values.Distinct().ToList();

    public TybscriType Map(Type clrType)
    {
        var mappedType = _mappings.GetValueOrDefault(clrType);
        if (mappedType != null) {
            return mappedType.CreateType();
        }

        // TODO make generic for all types
        var genericClrList = ReflectionHelper.GetGenericTypeOfDefinition(clrType, typeof(IList<>));
        if (genericClrList != null) {
            var clrItemType = genericClrList.GenericTypeArguments[0];
            var itemType = Map(clrItemType);
            return _mappings[typeof(List<>)].CreateType(itemType);
        }

        if (clrType.IsAssignableTo(typeof(Delegate))) {
            return MapFuncType(clrType);
        }

        if (clrType.IsClass || clrType.IsInterface) {
            return DefineObject(clrType).CreateType();
        }

        throw new InvalidOperationException($"The CLR type {clrType} cannot automatically be mapped to a tybscri type");
    }

    private TybscriType MapFuncType(Type clrType)
    {
        return MapMethodInfo(clrType.GetMethod("Invoke") ??
                             throw new InvalidOperationException(
                                 $"CLR type {clrType} cannot be mapped to a tybscri func type"));
    }

    private ObjectDefinitionType DefineObject(Type type)
    {
        var typeName = _options.TypeNameFormatter(type);
        var members = new List<TybscriMember>();
        var objectDefinitionType = new ObjectDefinitionType(typeName, type, ArraySegment<TypeParameter>.Empty,
            new Lazy<IReadOnlyCollection<TybscriMember>>(() => members));
        Add(type, objectDefinitionType);
        members.AddRange(DefineMembers(type).OrderBy(x => x.Name));
        return objectDefinitionType;
    }

    private IReadOnlyCollection<TybscriMember> DefineMembers(Type type)
    {
        var memberInfos = type.GetMembers(_options.MemberBindingFilter).Where(_options.MemberFilter);

        var members = new List<TybscriMember>();

        foreach (var memberInfo in memberInfos) {
            switch (memberInfo) {
                case FieldInfo fieldInfo when _options.TypeFilter(fieldInfo.FieldType):
                {
                    members.Add(CreateMember(Map(fieldInfo.FieldType), fieldInfo));
                    break;
                }

                case PropertyInfo propertyInfo when _options.TypeFilter(propertyInfo.PropertyType):
                {
                    members.Add(CreateMember(Map(propertyInfo.PropertyType), propertyInfo));
                    break;
                }

                case MethodInfo methodInfo when _options.TypeFilter(methodInfo.ReturnType):
                {
                    members.Add(CreateMember(MapMethodInfo(methodInfo), memberInfo));
                    break;
                }
            }
        }

        return members;

        TybscriMember CreateMember(TybscriType tybscriType, MemberInfo memberInfo)
        {
            return new TybscriMember(_options.MemberNameFormatter(memberInfo), tybscriType, memberInfo);
        }
    }

    public TybscriType MapMethodInfo(MethodInfo methodInfo)
    {
        var async = methodInfo.ReturnType.IsAssignableTo(typeof(Task));
        var clrReturnType = async ? methodInfo.ReturnType.GetTaskType()! : methodInfo.ReturnType;
        var returnType = Map(clrReturnType);

        var parameters = new List<FuncParameter>();
        var funcType = new FuncType(returnType, () => parameters, async);
        parameters.AddRange(methodInfo.GetParameters()
            .Select((p, i) => new FuncParameter(p.Name ?? $"arg{i}", Map(p.ParameterType))));
        return funcType;
    }

    private void Add(Type clrType, DefinitionType tybscriType)
    {
        if (_mappings.TryGetValue(clrType, out var alreadyMapped)) {
            if (tybscriType != alreadyMapped) {
                throw new ArgumentException("CLR type already mapped to a different tybscri type", nameof(tybscriType));
            }

            return;
        }

        _mappings.Add(clrType, tybscriType);
    }

    public TypeMappings ToTypeMappings()
    {
        return new TypeMappings(_mappings);
    }
}