import { Type } from "../types/common";
import { AnalyzeContext, Node } from "./base";
import { StatementNode } from "./statements";

export class ScriptNode extends Node {
  protected analyzeInternal(context: AnalyzeContext): Type | null {
    for (const stat of this.statements) {
      stat.analyze(context);
    }

    return this.statements[0].valueType;
  }

  public getChildren() {
    return this.statements;
  }

  constructor(public readonly statements: StatementNode[]) {
    super();
  }
}
