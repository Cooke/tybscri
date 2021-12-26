import { Type } from "../types/common";
import { AnalyzeContext, Node } from "./base";
import { ActualTokenNode } from "./token";

export abstract class StatementNode extends Node {}

export class MissingStatementNode extends StatementNode {
  protected analyzeInternal(context: AnalyzeContext): Type | null {
    return null;
  }

  public getChildren(): readonly Node[] {
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
