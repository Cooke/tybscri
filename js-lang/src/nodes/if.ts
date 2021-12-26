import { Type, UnionType } from "../types/common";
import { nullType } from "../types/null";
import { unknownType } from "../types/unknown";
import { AnalyzeContext, Node } from "./base";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class IfNode extends Node {
  protected analyzeInternal(context: AnalyzeContext): Type | null {
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
    return unionType;
  }

  public getChildren(): readonly Node[] {
    return [
      this.ifToken,
      this.openParen,
      this.condition,
      this.closeParen,
      this.thenBlock,
      ...(this.elseBlock ? [this.elseBlock] : []),
    ];
  }

  constructor(
    public readonly ifToken: TokenNode,
    public readonly openParen: TokenNode,
    public readonly condition: ExpressionNode,
    public readonly closeParen: TokenNode,
    public readonly thenBlock: ExpressionNode,
    public readonly elseBlock: ExpressionNode | null
  ) {
    super();
  }
}
