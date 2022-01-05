import { Symbol } from "../symbols";
import { SourceSpan } from "../common";
import { Type, unknownType } from "../typeSystem";
import { AnalyzeContext, Node } from "./base";
import { FunctionNode } from "./function";
import { StatementNode } from "./statements";
import { VariableDeclarationNode } from "./variableDeclaration";
import { Scope } from "../scope";

export class ScriptNode extends Node {
  public get valueType(): Type {
    return (
      this.statements[this.statements.length - 1]?.valueType ?? unknownType
    );
  }

  public setupScopes(scope: Scope, context: AnalyzeContext) {
    const hoistedScopeSymbols = this.statements
      .filter((x): x is FunctionNode => x instanceof FunctionNode)
      .reduce<Symbol[]>((p, c) => [...p, c.symbol], []);
    let blockScope = new Scope(scope, hoistedScopeSymbols);

    for (const statement of this.statements) {
      statement.setupScopes(blockScope, context);

      if (statement instanceof VariableDeclarationNode) {
        blockScope = blockScope.withSymbols([statement.symbol]);
      }
    }

    this.scope = blockScope;
  }

  public get span(): SourceSpan {
    if (this.statements.length === 0) {
      return {
        start: { column: 1, index: 0, line: 1 },
        stop: { column: 1, index: 0, line: 1 },
      };
    }

    return super.span;
  }

  constructor(public readonly statements: StatementNode[]) {
    super(statements);
  }
}
