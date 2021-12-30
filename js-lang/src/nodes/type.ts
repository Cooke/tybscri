import { Scope, Symbol } from "../common";
import { Type } from "../types/common";
import { numberType } from "../types/number";
import { stringType } from "../types/string";
import { AnalyzeContext, Node } from "./base";
import { ExpressionNode } from "./expression";
import { IdentifierNode } from "./identifier";
import { LiteralNode } from "./literal";

export class TypeNode extends ExpressionNode {
  public type: Type | null = null;
  private typeSymbol: Symbol | null = null;

  public setupSymbols(scope: Scope, context: AnalyzeContext): Scope {
    if (this.node instanceof IdentifierNode) {
      this.typeSymbol = scope.resolveLast(this.node.text);
      // TODO report if not found
    } else {
      this.type = {
        kind: "Literal",
        value: this.node.value,
        valueType:
          typeof this.node.value === "string" ? stringType : numberType,
      };
    }

    return scope;
  }

  protected analyzeInternal(context: AnalyzeContext) {
    if (this.typeSymbol) {
      this.typeSymbol.analyze(context);
      this.type = this.typeSymbol.valueType;
    }

    return null;
  }

  public getChildren(): Node[] {
    return [this.node];
  }

  constructor(public readonly node: LiteralNode | IdentifierNode) {
    super();
  }
}
