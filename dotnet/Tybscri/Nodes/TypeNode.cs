using System.Linq.Expressions;

namespace Tybscri.Nodes;

public abstract class TypeNode : Node
{
    public abstract TybscriType Type { get; }

    public override void SetupScopes(ScopeContext scopeContext)
    {
        Scope = scopeContext.Scope;
    }

    public override Expression ToClrExpression(GenerateContext generateContext)
    {
        throw new NotSupportedException("A type node cannot be converted to an LINQ expression");
    }
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