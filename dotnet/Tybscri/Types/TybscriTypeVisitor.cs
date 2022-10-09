using Tybscri.Common;

namespace Tybscri;

public interface TybscriTypeVisitor<out TResult>
{
    TResult VisitFunc(FuncType funcType);
    
    TResult VisitLiteral(LiteralType literalType);
    
    TResult VisitObject(ObjectType objectType);
    
    TResult VisitParameter(TypeParameter typeParameter);
    
    TResult VisitNever(NeverType neverType);
    
    TResult VisitTypeDefinition(ObjectDefinitionType objectDefinitionType);
    
    TResult VisitUnion(UnionType unionType);
    
    TResult VisitUnknown(UnknownType unknownType);
    
    TResult VisitVoid(VoidType voidType);
    
    TResult VisitVoidDefinition(VoidDefinitionType voidDefinitionType);
    
    TResult VisitNeverDefinition(NeverDefinitionType neverDefinitionType);
}