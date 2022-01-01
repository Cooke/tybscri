import { neverType } from "../types/never";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class ReturnNode extends ExpressionNode {
  constructor(
    public readonly token: TokenNode,
    public readonly expression: ExpressionNode | null
  ) {
    super([token]);
    this.valueType = neverType;
  }
}
