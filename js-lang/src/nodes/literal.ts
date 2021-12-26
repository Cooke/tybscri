import { Type } from "../types/common";
import { AnalyzeContext, Node } from "./base";
import { ExpressionNode } from "./expression";

export class LiteralNode extends ExpressionNode {
  protected analyzeInternal(context: AnalyzeContext) {
    return this.literalType;
  }

  public getChildren(): Node[] {
    return this.tokens;
  }

  constructor(
    public readonly tokens: Node[],
    public readonly value: any,
    public readonly literalType: Type
  ) {
    super();
  }
}
