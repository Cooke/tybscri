import { Scope, Symbol } from "../common";
import { Type } from "../types/common";
import { AnalyzeContext, Node } from "./base";
import { ExpressionNode } from "./expression";
import { StatementNode } from "./statements";

export class BlockNode extends ExpressionNode {
  protected analyzeInternal(context: AnalyzeContext): Type | null {
    const scopeSymbols = this.statements.reduce<Symbol[]>(
      (p, c) => p.concat(c.collectSymbols()),
      []
    );

    const blockScope = new Scope(context.scope, scopeSymbols);
    const blockContext: AnalyzeContext = { ...context, scope: blockScope };

    for (const statement of this.statements) {
      statement.analyze(blockContext);
    }

    return this.statements[this.statements.length - 1].valueType;
  }

  public getChildren(): readonly Node[] {
    return [...this.statements];
  }

  constructor(public readonly statements: StatementNode[]) {
    super();
  }
}
