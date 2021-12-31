import { Scope } from "../common";
import { Type, UnionType } from "../types/common";
import { nullType } from "../types/null";
import { unknownType } from "../types/unknown";
import { AnalyzeContext, Node } from "./base";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class IfNode extends ExpressionNode {
  public setupScopes(scope: Scope, context: AnalyzeContext) {
    this.condition.setupScopes(scope, context);
    this.thenBlock.setupScopes(
      scope.withSymbols(this.condition.truthSymbols),
      context
    );
  }

  public analyze(context: AnalyzeContext) {
    this.condition.analyze(context);
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
