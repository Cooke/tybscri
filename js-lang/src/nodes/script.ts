import { Scope } from "../common";
import { AnalyzeContext, Node } from "./base";
import { BlockNode } from "./block";
import { StatementNode } from "./statements";

export class ScriptNode extends Node {
  private block: BlockNode;

  public setupScopes(scope: Scope, context: AnalyzeContext) {
    this.block.setupScopes(scope, context);
  }

  public analyze(context: AnalyzeContext): void {
    this.block.analyze(context);
  }

  constructor(public readonly statements: StatementNode[]) {
    super(statements);
    this.block = new BlockNode(statements);
  }
}
