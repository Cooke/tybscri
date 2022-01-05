import { Symbol } from "../symbols";
import { Scope } from "../scope";
import { nullType, unknownType } from "../typeSystem";
import { UnionType } from "../typeSystem/common";
import { AnalyzeContext } from "./base";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class IfNode extends ExpressionNode {
  private thenSymbols: Symbol[] = [];

  public setupScopes(scope: Scope, context: AnalyzeContext) {
    this.condition.setupScopes(scope, context);
    this.thenSymbols = this.condition.createTruthNarrowedSymbols();
    this.thenBlock.setupScopes(scope.withSymbols(this.thenSymbols), context);
    this.scope = scope;
  }

  public analyze(context: AnalyzeContext) {
    this.condition.analyze(context);
    for (const sym of this.thenSymbols) {
      sym.analyze(context);
    }
    this.thenBlock.analyze(context);
    this.elseBlock?.analyze(context);
    const unionType: UnionType = {
      kind: "Union",
      types: this.elseBlock
        ? [
            this.thenBlock.valueType ?? unknownType,
            this.elseBlock.valueType ?? unknownType,
          ]
        : [this.thenBlock.valueType ?? unknownType, nullType],
    };
    this.valueType = unionType;
  }

  constructor(
    public readonly ifToken: TokenNode,
    public readonly openParen: TokenNode,
    public readonly condition: ExpressionNode,
    public readonly closeParen: TokenNode,
    public readonly thenBlock: ExpressionNode,
    public readonly elseBlock: ExpressionNode | null
  ) {
    super([
      ifToken,
      openParen,
      condition,
      closeParen,
      thenBlock,
      ...(elseBlock ? [elseBlock] : []),
    ]);
  }
}
