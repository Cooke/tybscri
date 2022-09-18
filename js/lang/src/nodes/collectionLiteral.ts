import { bindGenericObjectType, listType, UnionType } from "../typeSystem";
import { CompileContext } from "../common";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class CollectionLiteralNode extends ExpressionNode {
  public resolveTypes(context: CompileContext): void {
    for (const exp of this.expressions) {
      exp.resolveTypes(context);
    }

    const itemType = UnionType.create(this.expressions.map((x) => x.valueType));

    this.valueType = bindGenericObjectType(listType, [itemType]);
  }

  constructor(
    public readonly lbracket: TokenNode,
    public readonly expressions: ExpressionNode[],
    public readonly rbracket: TokenNode
  ) {
    super([lbracket, ...expressions, rbracket]);
  }
}
