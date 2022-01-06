import { Symbol } from "../symbols";
import { Scope } from "../scope";
import { unknownType } from "../typeSystem";
import { Type } from "../typeSystem/common";
import { CompileContext } from "../common";
import { ExpressionNode } from "./expression";
import { FunctionNode } from "./function";
import { StatementNode } from "./statements";
import { TokenNode } from "./token";
import { VariableDeclarationNode } from "./variableDeclaration";

export class BlockNode extends ExpressionNode {
  public get valueType(): Type {
    return (
      this.statements[this.statements.length - 1]?.valueType ?? unknownType
    );
  }

  public setupScopes(scope: Scope, context: CompileContext) {
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

  constructor(
    public readonly leftCurl: TokenNode,
    public readonly statements: StatementNode[],
    public readonly rightCurl: TokenNode
  ) {
    super([leftCurl, ...statements, rightCurl]);
  }
}
