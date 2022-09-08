using System.Reflection;

namespace Tybscri.TypeMapping;

public interface ITypeMapper
{
    TybscriType Map(Type clrType);
    
    TybscriType MapMethodInfo(MethodInfo methodInfo);
}