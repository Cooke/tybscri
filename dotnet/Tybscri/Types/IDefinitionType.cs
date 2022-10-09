namespace Tybscri;

public abstract class DefinitionType : TybscriType
{
    public abstract string Name { get; }

    public abstract TybscriType CreateType(params TybscriType[] typeArguments);
}