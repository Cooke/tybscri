import { Type } from "../types/common";
import { Node } from "./base";
import { ActualTokenNode } from "./token";

export abstract class ExpressionNode extends Node {}

export class MissingExpressionNode extends ExpressionNode {
  public get type() {
    return null;
  }
  //   public visit<TReturn, TContext>(
  //     visitor: Visitor<TReturn, TContext>,
  //     context: TContext
  //   ): TReturn {
  //     return visitor.visitMissingExpression(this, context);
  //   }

  public getChildren() {
    return [];
  }

  public get span() {
    return {
      start: this.actualToken.span.start,
      stop: this.actualToken.span.start,
    };
  }

  constructor(public readonly actualToken: ActualTokenNode) {
    super();
  }
}
