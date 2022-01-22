using System.Reflection;
using System.Runtime.Serialization;
using CookeRpc.AspNetCore.Utils;

namespace CookeRpc.AspNetCore.Model
{
    public class TypeMapperOptions
    {
        public Func<Type, bool> InterfaceFilter { get; init; } =
            t => t.Namespace != null && !t.Namespace.StartsWith("System");

        public Func<Type, bool> TypeFilter { get; init; } = t => !IsReflectionType(t);

        private static bool IsReflectionType(Type type) =>
            type == typeof(Type) || type.Namespace?.StartsWith("System.Reflection") == true;

        public Func<MemberInfo, string> MemberNameFormatter { get; init; } = memberInfo =>
            Char.ToLower(memberInfo.Name[0]) + memberInfo.Name.Substring(1);

        public Func<Type, string> TypeNameFormatter { get; init; } = type =>
            type.GetCustomAttribute<TybscriTypeAttribute>()?.Name ?? (type.IsInterface && type.Name.StartsWith("I")
                ? type.Name.Substring(1)
                : type.Name);

        public BindingFlags MemberBindingFilter { get; init; } = BindingFlags.Public | BindingFlags.Instance;

        public Func<MemberInfo, bool> MemberFilter { get; init; } = info =>
        {
            return info switch
            {
                _ when info.GetCustomAttribute<IgnoreDataMemberAttribute>() != null => false,
                FieldInfo fi => !IsReflectionType(fi.FieldType),
                PropertyInfo pi => !IsReflectionType(pi.PropertyType),
                _ => false
            };
        };

        public Func<MemberInfo, bool> IsMemberNullable { get; init; } = ReflectionHelper.IsNullable;

        public Func<string, string> EnumMemberNameFormatter { get; init; } = name => name;
    }

    public class TybscriTypeAttribute : Attribute
    {
        public string Name { get; }
    }
}