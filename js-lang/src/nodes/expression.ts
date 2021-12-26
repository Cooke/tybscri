import { Type } from "../types/common";
import { AnalyzeContext, Node } from "./base";
import { ActualTokenNode } from "./token";
import { Symbol } from "../common";

export abstract class ExpressionNode extends Node {
  public get truthSymbols(): Symbol[] {
    return [];
  }
}

export class MissingExpressionNode extends ExpressionNode {
  protected analyzeInternal(context: AnalyzeContext): Type | null {
    return null;
  }

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
