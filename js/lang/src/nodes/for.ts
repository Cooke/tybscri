import { SourceSymbol } from "../SourceSymbol";
import { CompileContext, ResolveContext } from "../common";
import { Scope } from "../scope";
import { Type, unknownType, VoidType } from "../typeSystem";
import { ObjectType } from "../typeSystem/ObjectType";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class ForNode extends ExpressionNode {
  public itemSymbol: SourceSymbol;

  private itemType: Type = unknownType;
  private compileContext: CompileContext | null = null;

  public setupScopes(scope: Scope, context: CompileContext) {
    this.compileContext = context;
    this.collection.setupScopes(scope, context);
    const bodyScope = scope.withSymbols([this.itemSymbol]);
    this.body.setupScopes(bodyScope, context);
    this.scope = scope;
  }

  public resolve(context: ResolveContext) {
    this.collection.resolve(context.withExpectedType(null));

    // Infer item type from collection type (List<T> -> T)
    const collectionType = this.collection.valueType;
    const collectionDefinition = this.compileContext?.environment.collectionDefinition;
    if (
      collectionType instanceof ObjectType &&
      collectionDefinition &&
      collectionType.definition === collectionDefinition
    ) {
      this.itemType = collectionType.typeArguments[0] ?? unknownType;
    } else {
      this.itemType = unknownType;
    }

    this.body.resolve(context.withExpectedType(null));
    this.valueType = VoidType.instance;
  }

  public get isConst(): boolean {
    return true;
  }

  public get valueType() {
    return super.valueType;
  }

  protected set valueType(val) {
    // Call parent setter
    Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(Object.getPrototypeOf(this)),
      "valueType"
    )?.set?.call(this, val);
  }

  public get itemValueType() {
    return this.itemType;
  }

  constructor(
    public readonly forToken: TokenNode,
    public readonly openParen: TokenNode,
    public readonly itemName: TokenNode,
    public readonly inToken: TokenNode,
    public readonly collection: ExpressionNode,
    public readonly closeParen: TokenNode,
    public readonly body: ExpressionNode
  ) {
    super([forToken, openParen, itemName, inToken, collection, closeParen, body]);
    this.itemSymbol = new SourceSymbol(this.itemName.text, {
      resolve: () => {},
      get valueType() {
        return (this as any).owner.itemType;
      },
      isConst: true,
    });
    // Set owner reference for the symbol
    (this.itemSymbol.node as any).owner = this;
  }
}
