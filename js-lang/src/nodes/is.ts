import { NarrowedSymbol, Scope, Symbol } from "../common";
import { booleanType } from "../types/boolean";
import { Type } from "../types/common";
import { numberType } from "../types/number";
import { stringType } from "../types/string";
import { AnalyzeContext, Node } from "./base";
import { ExpressionNode } from "./expression";
import { IdentifierNode } from "./identifier";
import { LiteralNode } from "./literal";

export class IsNode extends ExpressionNode {
  public get truthSymbols(): Symbol[] {
    return this.exp instanceof IdentifierNode && this.exp.symbol!.isConst
      ? [
          new NarrowedSymbol(this.exp.symbol!, () => ({
            kind: "Literal",
            value: this.typeLiteral.value,
            valueType:
              typeof this.typeLiteral.value === "string"
                ? stringType
                : numberType,
          })),
        ]
      : [];
  }

  public setupSymbols(scope: Scope, context: AnalyzeContext): Scope {
    this.exp.setupSymbols(scope, context);
    return scope;
  }

  protected analyzeInternal(context: AnalyzeContext): Type | null {
    this.exp.analyze(context);
    this.typeLiteral.analyze(context);
    return booleanType;
  }

  public getChildren(): readonly Node[] {
    return [this.exp, this.typeLiteral];
  }

  constructor(
    public readonly exp: ExpressionNode,
    public readonly typeLiteral: LiteralNode
  ) {
    super();
  }
}
