import { Type } from "../types/common";
import { AnalyzeContext, Node } from "./base";
import { StatementNode } from "./statements";
import { Scope, Symbol } from "../common";
import { FunctionNode } from "./function";

export class ScriptNode extends Node {
  public setupSymbols(scope: Scope, context: AnalyzeContext) {
    const hoistedScopeSymbols = this.statements
      .filter((x): x is FunctionNode => x instanceof FunctionNode)
      .reduce<Symbol[]>((p, c) => [...p, c.symbol], []);
    let blockScope = new Scope(scope, hoistedScopeSymbols);

    for (const statement of this.statements) {
      blockScope = statement.setupSymbols(blockScope, context);
    }

    return scope;
  }

  protected analyzeInternal(context: AnalyzeContext): Type | null {
    for (const stat of this.statements) {
      stat.analyze(context);
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
