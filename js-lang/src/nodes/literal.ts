import { Type } from "../types/common";
import { Node } from "./base";
import { ExpressionNode } from "./expression";

export class LiteralNode extends ExpressionNode {
  // public visit<TReturn, TContext>(
  //   visitor: Visitor<TReturn, TContext>,
  //   context: TContext
  // ): TReturn {
  //   return visitor.visitLiteralSyntax(this, context);
  // }

  public get type() {
    return this.valueType;
  }

  public getChildren(): Node[] {
    return this.tokens;
  }

  constructor(
    public readonly tokens: Node[],
    public readonly value: any,
    public readonly valueType: Type
  ) {
    super();
  }
}
