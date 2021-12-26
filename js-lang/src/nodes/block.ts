import { Type } from "../types/common";
import { AnalyzeContext, Node } from "./base";
import { ExpressionNode } from "./expression";

export class BlockNode extends ExpressionNode {
  protected analyzeInternal(context: AnalyzeContext): Type | null {
    for (const statement of this.statements) {
      statement.analyze(context);
    }

    return this.statements[0].valueType;
  }

  public getChildren(): readonly Node[] {
    return [...this.statements];
  }

  constructor(public readonly statements: ExpressionNode[]) {
    super();
  }
}
