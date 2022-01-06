import { createUnionType, reduceUnionType } from "..";
import { deriveObjectType, listType } from "../typeSystem";
import { CompileContext } from "../common";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class CollectionLiteralNode extends ExpressionNode {
  public analyze(context: CompileContext): void {
    for (const exp of this.expressions) {
      exp.analyze(context);
    }

    const union = createUnionType(...this.expressions.map((x) => x.valueType));
    const itemType = reduceUnionType(union);

    this.valueType = deriveObjectType(listType, [itemType]);
  }

  constructor(
    public readonly lbracket: TokenNode,
    public readonly expressions: ExpressionNode[],
    public readonly rbracket: TokenNode
  ) {
    super([lbracket, ...expressions, rbracket]);
  }
}
