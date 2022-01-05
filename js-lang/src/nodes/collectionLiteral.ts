import { createUnionType, reduceUnionType } from "..";
import { listType } from "../types";
import { bindObjectTypeParameters } from "../types/genericFunctions";
import { AnalyzeContext } from "./base";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class CollectionLiteralNode extends ExpressionNode {
  public analyze(context: AnalyzeContext): void {
    for (const exp of this.expressions) {
      exp.analyze(context);
    }

    const union = createUnionType(...this.expressions.map((x) => x.valueType));
    const itemType = reduceUnionType(union);

    this.valueType = bindObjectTypeParameters(listType, [itemType]);
  }

  constructor(
    public readonly lbracket: TokenNode,
    public readonly expressions: ExpressionNode[],
    public readonly rbracket: TokenNode
  ) {
    super([lbracket, ...expressions, rbracket]);
  }
}
