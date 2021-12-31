import { LiteralType } from "../types/common";
import { Node } from "./base";
import { ExpressionNode } from "./expression";

export class LiteralNode extends ExpressionNode {
  constructor(
    public readonly tokens: Node[],
    public readonly value: any,
    public readonly literalType: LiteralType
  ) {
    super(tokens);
    this.valueType = literalType;
  }
}
