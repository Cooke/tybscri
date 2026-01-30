import { neverType } from "../typeSystem";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class ContinueNode extends ExpressionNode {
  constructor(public readonly token: TokenNode) {
    super([token]);
    this.valueType = neverType;
  }
}
