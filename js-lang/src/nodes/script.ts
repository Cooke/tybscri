import { Type } from "../types/common";
import { AnalyzeContext, Node } from "./base";
import { StatementNode } from "./statements";
import { Scope, Symbol } from "../common";

export class ScriptNode extends Node {
  protected analyzeInternal(context: AnalyzeContext): Type | null {
    const scopeSymbols = this.statements.reduce<Symbol[]>(
      (p, c) => p.concat(c.collectSymbols()),
      []
    );

    const scriptScope = new Scope(context.scope, scopeSymbols);
    const scriptContext: AnalyzeContext = { ...context, scope: scriptScope };

    for (const stat of this.statements) {
      stat.analyze(scriptContext);
    }

    return this.statements[this.statements.length - 1].valueType;
  }

  public getChildren() {
    return this.statements;
  }

  constructor(public readonly statements: StatementNode[]) {
    super();
  }
}
