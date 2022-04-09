using System.Linq.Expressions;

namespace Tybscri.Nodes;

public abstract class TypeNode : Node
{
    public abstract TybscriType Type { get; }
    
    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        throw new NotSupportedException("A type node cannot be converted to an LINQ expression");
    }
}

public class LiteralTypeNode : TypeNode
{
    public LiteralTypeNode(TybscriType type)
    {
        Type = type;
    }

    public override TybscriType Type { get; }
}

public class IdentifierTypeNode : TypeNode
{
    private Symbol? _symbol;
    
    public IdentifierNode Identifier { get; }

    public IdentifierTypeNode(IdentifierNode identifier)
    {
        Identifier = identifier;
    }

    public override void ResolveTypes(CompileContext context, AnalyzeContext analyzeContext)
    {
        _symbol = Scope.ResolveLast(Identifier.Name);
        _symbol?.ResolveTypes(context);
    }

    public override TybscriType Type => _symbol?.ValueType ?? StandardTypes.Unknown;
}

//
//
// public class TypeNode : Node {
//     public Token? Literal { get; }
//     public IdentifierNode? Identifier { get; }
//
//     private Symbol? typeSymbol;
//
// public TypeNode(Token literal) : base()
// {
//     Literal = literal;
// }
//
// public TypeNode(IdentifierNode identifier) : base()
// {
//     Identifier = identifier;
// }
//
// public Scope SetupScopes(Scope scope) {
//     if (Identifier is not null) {
//         this.typeSymbol = scope.GetLast(Identifier.Name);
//         // TODO report if not found
//     } else {
//         switch (this.Literal) {
//             { Valu}
//         }
//         _type = new BooleanLiteralType() {
//             kind: "Literal",
//             value: this.node.value,
//             valueType:
//             typeof this.node.value === "string" ? stringType : numberType,
//         };
//     }
//
//     this.scope = scope;
// }
//
// public resolveTypes(context: CompileContext) {
//     if (this.typeSymbol) {
//         this.typeSymbol.resolveTypes(context);
//         this._type = this.typeSymbol.valueType;
//     }
// }
// }
